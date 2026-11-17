package com.impulso.estrutura;

import com.impulso.enums.SexoEnum;
import com.impulso.enums.TipoCalculoEnum;
import com.impulso.enums.TipoIndicadorEnum;
import com.impulso.enums.TipoRespostaEnum;
import com.impulso.estrutura.EstruturaAvaliacao.FaixaModelo;
import com.impulso.estrutura.EstruturaAvaliacao.GrupoModelo;
import com.impulso.estrutura.EstruturaAvaliacao.PerguntaModelo;
import com.impulso.estrutura.EstruturaAvaliacao.SubgrupoModelo;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.MatchResult;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.IntStream;
import java.util.stream.Stream;

// Lê a planilha de importação da estrutura da ficha (o modelo é o estrutura-avaliacao.xlsx, com as abas
// Grupos, Testes, Perguntas, Tabelas e Linhas das tabelas) e devolve a estrutura pronta para gravar.
// Confere a planilha inteira antes: se houver erro, devolve todos de uma vez (aba e linha) e nada é gravado.
@Component
public class LeitorPlanilhaEstrutura {

    // avisos: o que não impede a importação, mas é bom saber (ex.: teste sem tabela, borda ajustada).
    public record Leitura(EstruturaAvaliacao estrutura, List<String> avisos) {
    }

    public Leitura ler(Path arquivo){
        if(!Files.isRegularFile(arquivo)){
            throw new IllegalArgumentException("Planilha não encontrada: " + arquivo);
        }
        Workbook planilha;
        try {
            planilha = WorkbookFactory.create(arquivo.toFile(), null, true);
        } catch (IOException | RuntimeException e) {
            throw new IllegalArgumentException("Não foi possível abrir a planilha " + arquivo + " (" + e.getMessage() + ")", e);
        }
        try (planilha) {
            return new Conferencia(planilha).executar();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static final class Conferencia {

        private static final String NUMERO = "\\d+(?:[.,]\\d+)?";
        // Um nível da linha de uma tabela: "< 100", "<= 100", "100 - 149", ">= 150", "> 149" ou um número solto.
        private static final Pattern SEGMENTO = Pattern.compile(
                "(<=|>=|=<|=>|<|>)\\s*(" + NUMERO + ")|(" + NUMERO + ")\\s*[-–]\\s*(" + NUMERO + ")|(" + NUMERO + ")");
        private static final Pattern IDADE_E_VALORES = Pattern.compile("\\s*(\\d+)(?:\\s*[-–]\\s*(\\d+))?\\s+(.+)");
        // Linha que só tem o número de uma lista colada ("1", "2.") e a numeração no começo de uma pergunta.
        private static final Pattern SO_NUMERO = Pattern.compile("\\d+\\s*[.)º°–-]?");
        private static final Pattern NUMERACAO = Pattern.compile("^\\s*\\d+\\s*[.)º°–-]?\\s+");

        private static final Map<String, TipoCalculoEnum> RESULTADOS = Map.of(
                "maior valor", TipoCalculoEnum.MAIOR_VALOR, "menor valor", TipoCalculoEnum.MENOR_VALOR,
                "estágio", TipoCalculoEnum.ESTAGIO, "estagio", TipoCalculoEnum.ESTAGIO, "nenhum", TipoCalculoEnum.NENHUM);
        private static final Map<String, TipoRespostaEnum> RESPOSTAS = Map.of(
                "número", TipoRespostaEnum.NUMERO, "numero", TipoRespostaEnum.NUMERO,
                "sim/não/parcial", TipoRespostaEnum.SIM_NAO_PARCIAL, "sim/nao/parcial", TipoRespostaEnum.SIM_NAO_PARCIAL);

        private record Linha(String aba, int numero, String[] valores, boolean[] datas) {
            String valor(int coluna){
                return valores[coluna];
            }
        }

        private record GrupoLido(String nome, int idadeMin, int idadeMax, int linha) {
        }

        // grupos: as chaves (nome normalizado) dos grupos em que o teste entra.
        private record TesteLido(String nome, List<String> grupos, TipoCalculoEnum calculo, int linha) {
        }

        private record TabelaLida(String codigo, TipoIndicadorEnum indicador, TesteLido teste, List<String> niveis,
                                  int linha) {
        }

        private record LinhaLida(TabelaLida tabela, SexoEnum sexo, int idadeMin, int idadeMax, List<BigDecimal> inicios) {
        }

        private final Workbook planilha;
        private final DataFormatter formatador = new DataFormatter(Locale.forLanguageTag("pt-BR"));
        private final List<String> erros = new ArrayList<>();
        private final List<String> avisos = new ArrayList<>();

        private final Map<String, GrupoLido> grupos = new LinkedHashMap<>();
        private final Map<String, TesteLido> testes = new LinkedHashMap<>();
        private final Map<String, List<PerguntaModelo>> perguntas = new HashMap<>();
        private final Map<String, TabelaLida> tabelas = new LinkedHashMap<>();
        private final List<LinhaLida> linhas = new ArrayList<>();

        Conferencia(Workbook planilha){
            this.planilha = planilha;
        }

        Leitura executar(){
            lerGrupos();
            lerTestes();
            lerPerguntas();
            lerTabelas();
            lerLinhas();
            conferirCobertura();
            if(!erros.isEmpty()){
                throw new PlanilhaInvalidaException(erros);
            }
            return new Leitura(montar(), List.copyOf(avisos));
        }

        // ------------------------------------------------------------------ Grupos
        private void lerGrupos(){
            for(Linha linha : linhasDa("Grupos", 3)){
                String nome = linha.valor(0);
                if(nome.isEmpty()){
                    erro(linha, "grupo sem nome");
                    continue;
                }
                if(nome.length() > 50){
                    erro(linha, "nome com " + nome.length() + " letras (máximo 50)");
                }
                Integer minimo = inteiro(linha.valor(1));
                Integer maximo = inteiro(linha.valor(2));
                if(minimo == null || maximo == null){
                    erro(linha, "a idade mínima e a máxima precisam ser números inteiros");
                    continue;
                }
                if(minimo < 0 || minimo > maximo || maximo > 99){
                    erro(linha, "faixa de idade inválida (" + minimo + " a " + maximo + ")");
                    continue;
                }
                GrupoLido repetido = grupos.get(chave(nome));
                if(repetido != null){
                    erro(linha, "grupo repetido (já está na linha " + repetido.linha() + ")");
                    continue;
                }
                grupos.put(chave(nome), new GrupoLido(nome, minimo, maximo, linha.numero()));
            }

            List<GrupoLido> ordenados = grupos.values().stream().sorted(Comparator.comparingInt(GrupoLido::idadeMin)).toList();
            for(int i = 1; i < ordenados.size(); i++){
                GrupoLido anterior = ordenados.get(i - 1);
                GrupoLido atual = ordenados.get(i);
                if(atual.idadeMin() <= anterior.idadeMax()){
                    erros.add("[Grupos] linha " + atual.linha() + ": a faixa " + atual.idadeMin() + "–" + atual.idadeMax()
                            + " se sobrepõe à da linha " + anterior.linha() + " (" + anterior.idadeMin() + "–" + anterior.idadeMax() + ")");
                } else if(atual.idadeMin() > anterior.idadeMax() + 1){
                    avisos.add("[Grupos] linha " + atual.linha() + ": as idades " + (anterior.idadeMax() + 1) + " a "
                            + (atual.idadeMin() - 1) + " ficam sem grupo");
                }
            }
        }

        // ------------------------------------------------------------------ Testes
        private void lerTestes(){
            for(Linha linha : linhasDa("Testes", 3)){
                String nome = linha.valor(0);
                if(nome.isEmpty()){
                    erro(linha, "teste sem nome");
                    continue;
                }
                if(nome.length() > 100){
                    erro(linha, "nome com " + nome.length() + " letras (máximo 100)");
                }
                TesteLido repetido = testes.get(chave(nome));
                if(repetido != null){
                    erro(linha, "teste repetido (já está na linha " + repetido.linha() + ")");
                    continue;
                }
                List<String> chavesGrupos = new ArrayList<>();
                List<String> nomesGrupos = Arrays.stream(linha.valor(1).split("[;,]")).map(String::strip)
                        .filter(nomeGrupo -> !nomeGrupo.isEmpty()).toList();
                if(nomesGrupos.isEmpty()){
                    erro(linha, "a coluna Grupos está vazia");
                }
                for(String nomeGrupo : nomesGrupos){
                    if(!grupos.containsKey(chave(nomeGrupo))){
                        erro(linha, "o grupo '" + nomeGrupo + "' não está na aba Grupos");
                    } else if(!chavesGrupos.contains(chave(nomeGrupo))){
                        chavesGrupos.add(chave(nomeGrupo));
                    }
                }
                TipoCalculoEnum calculo = RESULTADOS.get(chave(linha.valor(2)));
                if(calculo == null){
                    erro(linha, "Resultado inválido ('" + linha.valor(2) + "'): use Maior valor, Menor valor, Estágio ou Nenhum");
                    calculo = TipoCalculoEnum.NENHUM;
                }
                testes.put(chave(nome), new TesteLido(nome, chavesGrupos, calculo, linha.numero()));
            }
        }

        // ------------------------------------------------------------------ Perguntas
        private void lerPerguntas(){
            for(Linha linha : linhasDa("Perguntas", 4)){
                String bruto = linha.valor(1);
                if(SO_NUMERO.matcher(bruto).matches()){
                    continue;
                }
                TesteLido teste = testes.get(chave(linha.valor(0)));
                if(teste == null){
                    erro(linha, "o teste '" + linha.valor(0) + "' não está na aba Testes");
                    continue;
                }
                String texto = NUMERACAO.matcher(bruto).replaceFirst("").strip();
                if(texto.isEmpty()){
                    erro(linha, "pergunta vazia");
                    continue;
                }
                if(texto.length() > 255){
                    erro(linha, "pergunta com " + texto.length() + " letras (máximo 255)");
                }
                TipoRespostaEnum tipo = RESPOSTAS.get(chave(linha.valor(2)));
                if(tipo == null){
                    erro(linha, "Resposta inválida ('" + linha.valor(2) + "'): use Número ou Sim/Não/Parcial");
                    continue;
                }
                String unidade = linha.valor(3);
                if(unidade.length() > 20){
                    erro(linha, "unidade com " + unidade.length() + " letras (máximo 20)");
                }
                if(tipo == TipoRespostaEnum.NUMERO && unidade.isEmpty()){
                    aviso(linha, "pergunta de Número sem unidade");
                }
                if(tipo == TipoRespostaEnum.SIM_NAO_PARCIAL && !unidade.isEmpty()){
                    aviso(linha, "unidade numa pergunta Sim/Não/Parcial (foi ignorada)");
                    unidade = "";
                }
                if(!teste.calculo().aceita(tipo)){
                    erro(linha, "o teste '" + teste.nome() + "' tem Resultado " + rotulo(teste.calculo())
                            + ", que não aceita pergunta de " + rotulo(tipo));
                }
                List<PerguntaModelo> doTeste = perguntas.computeIfAbsent(chave(teste.nome()), k -> new ArrayList<>());
                if(doTeste.stream().anyMatch(pergunta -> chave(pergunta.texto()).equals(chave(texto)))){
                    aviso(linha, "pergunta repetida no teste '" + teste.nome() + "'");
                }
                doTeste.add(new PerguntaModelo(texto, tipo, unidade.isEmpty() ? null : unidade));
            }
            for(TesteLido teste : testes.values()){
                if(!perguntas.containsKey(chave(teste.nome()))){
                    erros.add("[Testes] linha " + teste.linha() + ": o teste '" + teste.nome() + "' não tem nenhuma pergunta na aba Perguntas");
                }
            }
        }

        // ------------------------------------------------------------------ Tabelas
        private void lerTabelas(){
            for(Linha linha : linhasDa("Tabelas", 4)){
                String codigo = linha.valor(0);
                if(codigo.isEmpty()){
                    erro(linha, "tabela sem código");
                    continue;
                }
                TabelaLida repetida = tabelas.get(chave(codigo));
                if(repetida != null){
                    erro(linha, "código repetido (já está na linha " + repetida.linha() + ")");
                    continue;
                }
                TipoIndicadorEnum indicador = switch (chave(linha.valor(1))) {
                    case "teste" -> TipoIndicadorEnum.SUBGRUPO;
                    case "imc" -> TipoIndicadorEnum.IMC;
                    case "rce" -> TipoIndicadorEnum.RCE;
                    default -> null;
                };
                if(indicador == null){
                    erro(linha, "Vale para inválido ('" + linha.valor(1) + "'): use Teste, IMC ou RCE");
                    continue;
                }
                TesteLido teste = null;
                if(indicador == TipoIndicadorEnum.SUBGRUPO){
                    teste = testes.get(chave(linha.valor(2)));
                    if(teste == null){
                        erro(linha, "o teste '" + linha.valor(2) + "' não está na aba Testes");
                        continue;
                    }
                    if(!teste.calculo().resultadoNumerico()){
                        erro(linha, "o teste '" + teste.nome() + "' precisa ter Resultado Maior valor ou Menor valor para ter tabela");
                        continue;
                    }
                } else if(!linha.valor(2).isEmpty()){
                    aviso(linha, "coluna Teste preenchida numa tabela de IMC/RCE (foi ignorada)");
                }
                // Uma tabela só para cada teste (e uma só para IMC e para RCE): duas dariam faixas em conflito.
                TesteLido alvo = teste;
                TabelaLida outra = tabelas.values().stream()
                        .filter(tabela -> tabela.indicador() == indicador && tabela.teste() == alvo)
                        .findFirst().orElse(null);
                if(outra != null){
                    erro(linha, "já existe outra tabela para o mesmo " + (alvo == null ? "indicador" : "teste")
                            + " (linha " + outra.linha() + ")");
                    continue;
                }
                List<String> niveis = Arrays.stream(linha.valor(3).split(";")).map(String::strip)
                        .filter(nivel -> !nivel.isEmpty()).toList();
                if(niveis.size() < 2){
                    erro(linha, "a tabela precisa de pelo menos 2 níveis, separados por ponto e vírgula");
                    continue;
                }
                niveis.stream().filter(nivel -> nivel.length() > 30).forEach(nivel ->
                        erro(linha, "o nível '" + nivel + "' tem " + nivel.length() + " letras (máximo 30)"));
                if(niveis.stream().map(Conferencia::chave).distinct().count() != niveis.size()){
                    erro(linha, "nível repetido na tabela");
                }
                tabelas.put(chave(codigo), new TabelaLida(codigo, indicador, teste, niveis, linha.numero()));
            }
        }

        // ------------------------------------------------------------------ Linhas das tabelas
        private void lerLinhas(){
            Map<String, List<int[]>> idadesUsadas = new HashMap<>();
            for(Linha linha : linhasDa("Linhas das tabelas", 3)){
                TabelaLida tabela = tabelas.get(chave(linha.valor(0)));
                if(tabela == null){
                    erro(linha, "a tabela '" + linha.valor(0) + "' não está na aba Tabelas");
                    continue;
                }
                SexoEnum sexo = switch (chave(linha.valor(1))) {
                    case "masculino" -> SexoEnum.MASCULINO;
                    case "feminino" -> SexoEnum.FEMININO;
                    default -> null;
                };
                if(sexo == null){
                    erro(linha, "Sexo inválido ('" + linha.valor(1) + "'): use Masculino ou Feminino");
                    continue;
                }
                if(linha.datas()[2]){
                    erro(linha, "o Excel transformou a linha em data: formate a coluna como Texto e cole de novo");
                    continue;
                }
                Matcher partes = IDADE_E_VALORES.matcher(linha.valor(2).replace("≤", "<=").replace("≥", ">="));
                if(!partes.matches()){
                    erro(linha, "a linha precisa começar pela idade (ou uma faixa, como 6-8), seguida dos valores");
                    continue;
                }
                int idadeMin = Integer.parseInt(partes.group(1));
                int idadeMax = partes.group(2) == null ? idadeMin : Integer.parseInt(partes.group(2));
                if(idadeMin > idadeMax){
                    erro(linha, "faixa de idade invertida (" + idadeMin + "-" + idadeMax + ")");
                    continue;
                }
                List<BigDecimal> inicios = inicios(partes.group(3), tabela.niveis().size(), linha);
                if(inicios == null){
                    continue;
                }
                List<int[]> usadas = idadesUsadas.computeIfAbsent(chave(tabela.codigo()) + "|" + sexo, k -> new ArrayList<>());
                int[] cruzada = usadas.stream().filter(faixa -> idadeMin <= faixa[1] && faixa[0] <= idadeMax).findFirst().orElse(null);
                if(cruzada != null){
                    erro(linha, "a idade " + idadeMin + (idadeMax == idadeMin ? "" : "-" + idadeMax)
                            + " já tem linha para esse sexo nessa tabela (linha " + cruzada[2] + ")");
                    continue;
                }
                usadas.add(new int[]{idadeMin, idadeMax, linha.numero()});
                linhas.add(new LinhaLida(tabela, sexo, idadeMin, idadeMax, inicios));
            }
        }

        // Onde cada nível começa ("a partir de"), na ordem dos níveis. O primeiro começa em 0.
        private List<BigDecimal> inicios(String valores, int niveis, Linha linha){
            List<MatchResult> segmentos = SEGMENTO.matcher(valores).results().toList();
            String sobra = SEGMENTO.matcher(valores).replaceAll(" ").strip();
            if(!sobra.isEmpty()){
                erro(linha, "trecho que não deu para entender na linha: '" + sobra + "'");
                return null;
            }
            if(segmentos.size() == 1 && segmentos.get(0).group(5) != null){
                if(niveis != 2){
                    erro(linha, "um valor só por idade serve para tabela de 2 níveis (esta tem " + niveis + ")");
                    return null;
                }
                BigDecimal corte = numero(segmentos.get(0).group(5), linha);
                return corte == null ? null : List.of(BigDecimal.ZERO, corte);
            }

            List<BigDecimal> inicios = new ArrayList<>();
            BigDecimal fimAnterior = null;
            BigDecimal passoAnterior = null;
            boolean fimAnteriorInclusivo = false;
            for(int i = 0; i < segmentos.size(); i++){
                MatchResult segmento = segmentos.get(i);
                if(segmento.group(5) != null){
                    erro(linha, "valor solto no meio da linha (use < 100, 100 - 149 ou >= 150)");
                    return null;
                }
                String operador = segmento.group(1) == null ? null : segmento.group(1).replace("=<", "<=").replace("=>", ">=");
                BigDecimal inicio;
                BigDecimal fim = null;
                BigDecimal passo = null;
                boolean inclusivo = false;
                if("<".equals(operador) || "<=".equals(operador)){
                    if(i != 0){
                        erro(linha, "'" + operador + "' só pode aparecer no primeiro nível");
                        return null;
                    }
                    inicio = BigDecimal.ZERO;
                    fim = numero(segmento.group(2), linha);
                    passo = passo(segmento.group(2));
                    inclusivo = "<=".equals(operador);
                } else if(">".equals(operador) || ">=".equals(operador)){
                    if(i != segmentos.size() - 1){
                        erro(linha, "'" + operador + "' só pode aparecer no último nível");
                        return null;
                    }
                    BigDecimal valor = numero(segmento.group(2), linha);
                    inicio = valor == null ? null : (">=".equals(operador) ? valor : valor.add(passo(segmento.group(2))));
                } else {
                    inicio = numero(segmento.group(3), linha);
                    fim = numero(segmento.group(4), linha);
                    passo = passo(segmento.group(4));
                    inclusivo = true;
                    if(inicio != null && fim != null && fim.compareTo(inicio) < 0){
                        erro(linha, "intervalo invertido (" + segmento.group(3) + " - " + segmento.group(4) + ")");
                        return null;
                    }
                }
                if(inicio == null){
                    return null;
                }
                // Regra de borda: arredonda para baixo. O valor que cai num buraco ou numa sobreposição
                // entre dois níveis fica no nível de valores menores (o anterior na linha).
                if(fimAnterior != null){
                    BigDecimal esperado = fimAnteriorInclusivo ? fimAnterior.add(passoAnterior) : fimAnterior;
                    if(inicio.compareTo(esperado) > 0){
                        aviso(linha, "buraco entre os níveis " + i + " e " + (i + 1) + ": o que fica entre eles conta como "
                                + i + "º nível");
                    } else if(inicio.compareTo(esperado) < 0){
                        aviso(linha, "sobreposição entre os níveis " + i + " e " + (i + 1) + ": a borda fica no " + i
                                + "º nível, e o " + (i + 1) + "º passa a começar em " + esperado.toPlainString());
                        inicio = esperado;
                        if(fim != null && inicio.compareTo(fim) > 0){
                            erro(linha, "o " + (i + 1) + "º nível some inteiro dentro do " + i + "º");
                            return null;
                        }
                    }
                }
                fimAnterior = fim;
                passoAnterior = passo;
                fimAnteriorInclusivo = inclusivo;
                inicios.add(inicio);
            }
            if(inicios.size() != niveis){
                erro(linha, inicios.size() + " valor(es), mas a tabela tem " + niveis + " níveis");
                return null;
            }
            for(int i = 1; i < inicios.size(); i++){
                if(inicios.get(i).compareTo(inicios.get(i - 1)) <= 0){
                    erro(linha, "valores fora de ordem: cada nível precisa começar depois do anterior");
                    return null;
                }
            }
            return inicios;
        }

        // ------------------------------------------------------------------ Cobertura
        private void conferirCobertura(){
            for(TabelaLida tabela : tabelas.values()){
                Map<SexoEnum, Set<Integer>> idades = new EnumMap<>(SexoEnum.class);
                for(LinhaLida linha : linhas){
                    if(linha.tabela() == tabela){
                        IntStream.rangeClosed(linha.idadeMin(), linha.idadeMax()).forEach(idade ->
                                idades.computeIfAbsent(linha.sexo(), sexo -> new TreeSet<>()).add(idade));
                    }
                }
                String rotulo = "[Tabelas] linha " + tabela.linha() + ": a tabela '" + tabela.codigo() + "' ";
                if(idades.isEmpty()){
                    erros.add(rotulo + "não tem nenhuma linha");
                    continue;
                }
                if(idades.size() == 1){
                    avisos.add(rotulo + "só tem linhas de um sexo");
                } else if(!idades.get(SexoEnum.MASCULINO).equals(idades.get(SexoEnum.FEMININO))){
                    avisos.add(rotulo + "não tem as mesmas idades nos dois sexos");
                }
                if(tabela.teste() != null){
                    Set<Integer> cobertas = new HashSet<>();
                    idades.values().forEach(cobertas::addAll);
                    for(String chaveGrupo : tabela.teste().grupos()){
                        GrupoLido grupo = grupos.get(chaveGrupo);
                        List<Integer> faltam = IntStream.rangeClosed(grupo.idadeMin(), grupo.idadeMax())
                                .filter(idade -> !cobertas.contains(idade)).boxed().toList();
                        if(!faltam.isEmpty()){
                            avisos.add(rotulo + "não cobre as idades " + faltam + " do grupo '" + grupo.nome()
                                    + "' (ficam sem classificação)");
                        }
                    }
                }
            }
            for(TesteLido teste : testes.values()){
                boolean temTabela = tabelas.values().stream().anyMatch(tabela -> tabela.teste() == teste);
                if(teste.calculo().resultadoNumerico() && !temTabela){
                    avisos.add("[Testes] linha " + teste.linha() + ": o teste '" + teste.nome()
                            + "' não tem tabela (o resultado aparece sem classificação)");
                }
            }
        }

        // ------------------------------------------------------------------ Montagem
        private EstruturaAvaliacao montar(){
            List<GrupoModelo> gruposModelo = grupos.entrySet().stream()
                    .sorted(Comparator.comparingInt(entrada -> entrada.getValue().idadeMin()))
                    .map(entrada -> {
                        GrupoLido grupo = entrada.getValue();
                        List<SubgrupoModelo> subgrupos = testes.values().stream()
                                .filter(teste -> teste.grupos().contains(entrada.getKey()))
                                .map(teste -> new SubgrupoModelo(teste.nome(), teste.calculo(),
                                        List.copyOf(perguntas.get(chave(teste.nome()))), faixasDoTeste(teste, grupo)))
                                .toList();
                        return new GrupoModelo(grupo.nome(), grupo.idadeMin(), grupo.idadeMax(), subgrupos);
                    })
                    .toList();
            List<FaixaModelo> gerais = linhas.stream()
                    .filter(linha -> linha.tabela().indicador() != TipoIndicadorEnum.SUBGRUPO)
                    .flatMap(linha -> faixas(linha, linha.idadeMin(), linha.idadeMax()))
                    .toList();
            return new EstruturaAvaliacao(gruposModelo, gerais);
        }

        // As faixas de um teste dentro de um grupo: só as idades do grupo (a linha é cortada nos limites dele).
        private List<FaixaModelo> faixasDoTeste(TesteLido teste, GrupoLido grupo){
            return linhas.stream()
                    .filter(linha -> linha.tabela().teste() == teste)
                    .filter(linha -> linha.idadeMin() <= grupo.idadeMax() && grupo.idadeMin() <= linha.idadeMax())
                    .flatMap(linha -> faixas(linha, Math.max(linha.idadeMin(), grupo.idadeMin()),
                            Math.min(linha.idadeMax(), grupo.idadeMax())))
                    .toList();
        }

        private Stream<FaixaModelo> faixas(LinhaLida linha, int idadeMin, int idadeMax){
            List<String> niveis = linha.tabela().niveis();
            return IntStream.range(0, niveis.size()).mapToObj(i -> new FaixaModelo(linha.tabela().indicador(),
                    linha.sexo(), idadeMin, idadeMax, linha.inicios().get(i), niveis.get(i)));
        }

        // ------------------------------------------------------------------ Apoio
        // As linhas com dados de uma aba (da 2ª em diante), sem as vazias e sem as de exemplo.
        private List<Linha> linhasDa(String aba, int colunas){
            Sheet folha = planilha.getSheet(aba);
            if(folha == null){
                erros.add("Falta a aba " + aba + ".");
                return List.of();
            }
            List<Linha> resultado = new ArrayList<>();
            for(int indice = 1; indice <= folha.getLastRowNum(); indice++){
                Row row = folha.getRow(indice);
                if(row == null){
                    continue;
                }
                String[] valores = new String[colunas];
                boolean[] datas = new boolean[colunas];
                for(int coluna = 0; coluna < colunas; coluna++){
                    Cell celula = row.getCell(coluna);
                    valores[coluna] = celula == null ? "" : formatador.formatCellValue(celula).strip();
                    datas[coluna] = celula != null && celula.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(celula);
                }
                boolean vazia = Arrays.stream(valores).allMatch(String::isEmpty);
                if(vazia || valores[0].toLowerCase(Locale.ROOT).contains("(exemplo)")){
                    continue;
                }
                resultado.add(new Linha(aba, indice + 1, valores, datas));
            }
            return resultado;
        }

        private static String chave(String texto){
            return texto.strip().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
        }

        private static Integer inteiro(String texto){
            try {
                return new BigDecimal(texto.replace(',', '.')).intValueExact();
            } catch (NumberFormatException | ArithmeticException e) {
                return null;
            }
        }

        private BigDecimal numero(String texto, Linha linha){
            BigDecimal valor = new BigDecimal(texto.replace(',', '.'));
            if(valor.scale() > 2 || valor.compareTo(new BigDecimal("999999.99")) > 0){
                erro(linha, "o valor " + texto + " tem mais de 2 casas decimais ou é grande demais");
                return null;
            }
            return valor;
        }

        // O menor passo pelas casas decimais do número: 5,50 -> 0,01; 151 -> 1.
        private static BigDecimal passo(String texto){
            int virgula = Math.max(texto.indexOf(','), texto.indexOf('.'));
            int casas = virgula < 0 ? 0 : texto.length() - virgula - 1;
            return BigDecimal.ONE.scaleByPowerOfTen(-casas);
        }

        private static String rotulo(TipoCalculoEnum calculo){
            return switch (calculo) {
                case MAIOR_VALOR -> "Maior valor";
                case MENOR_VALOR -> "Menor valor";
                case ESTAGIO -> "Estágio";
                case NENHUM -> "Nenhum";
            };
        }

        private static String rotulo(TipoRespostaEnum tipo){
            return tipo == TipoRespostaEnum.NUMERO ? "Número" : "Sim/Não/Parcial";
        }

        private void erro(Linha linha, String mensagem){
            erros.add("[" + linha.aba() + "] linha " + linha.numero() + ": " + mensagem);
        }

        private void aviso(Linha linha, String mensagem){
            avisos.add("[" + linha.aba() + "] linha " + linha.numero() + ": " + mensagem);
        }
    }
}
