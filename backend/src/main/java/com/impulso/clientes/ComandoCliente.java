package com.impulso.clientes;

import com.impulso.config.ImportadorGeografia;
import com.impulso.dto.AdminRequest;
import com.impulso.dto.AtualizarUsuarioRequest;
import com.impulso.dto.EmpresaRequest;
import com.impulso.estrutura.EstruturaAvaliacao;
import com.impulso.estrutura.GravadorEstrutura;
import com.impulso.estrutura.LeitorEstruturaBanco;
import com.impulso.estrutura.LeitorPlanilhaEstrutura;
import com.impulso.estrutura.PlanilhaInvalidaException;
import com.impulso.model.Usuario;
import com.impulso.repository.UsuarioRepository;
import com.impulso.service.EmpresaService;
import com.impulso.service.UsuarioService;
import com.impulso.utils.NormalizadorEmail;
import jakarta.validation.Validator;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

// Comandos de administração pela linha de comando. O backend sobe, faz o pedido e termina:
//
//   --novo-cliente --codigo=escola-abc --nome="Escola ABC" --cnpj=11222333000181 --admin-email=dono@escolaabc.com.br
//     cria o banco do cliente, monta a estrutura, importa a geografia, cria a empresa e o
//     primeiro admin (com uma senha provisória mostrada uma vez só, para trocar no primeiro acesso).
//     A ficha (grupos, subgrupos, perguntas e faixas) vem copiada da escola modelo (app.clientes.modelo);
//     --modelo=código usa outra escola e --sem-modelo cria a escola com a ficha vazia.
//
//   --novo-cliente --codigo=escola-abc --nome="Escola ABC" --banco-existente=impulso
//     adota um banco que já existe (com empresa e usuários): marca a estrutura como versão 1
//     e coloca os e-mails dele na lista central de logins.
//
//   --redefinir-senha --email=dono@escolaabc.com.br
//     gera uma senha provisória nova para um acesso que já existe (para quem esqueceu a senha
//     e não tem outro admin que possa trocá-la pela tela Usuários).
//
//   --importar-estrutura --codigo=escola-abc --arquivo="C:\caminho\estrutura-avaliacao.xlsx"
//     grava a ficha de uma escola sem estrutura a partir da planilha de importação. Confere a planilha
//     inteira antes: se houver erro, mostra todos (aba e linha) e não grava nada.
@Component
public class ComandoCliente implements ApplicationRunner {

    public static final String OPCAO = "novo-cliente";
    public static final String OPCAO_SENHA = "redefinir-senha";
    public static final String OPCAO_ESTRUTURA = "importar-estrutura";

    private final ApplicationContext contexto;
    private final CatalogoClientes catalogo;
    private final DiretorioLogins diretorio;
    private final MigradorBancos migrador;
    private final ConexaoBancos conexao;
    private final JdbcClient central;
    private final ImportadorGeografia importadorGeografia;
    private final EmpresaService empresaService;
    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    private final LeitorPlanilhaEstrutura leitorPlanilha;
    private final LeitorEstruturaBanco leitorEstrutura;
    private final GravadorEstrutura gravadorEstrutura;
    private final Validator validador;
    private final String escolaModelo;

    public ComandoCliente(ApplicationContext contexto, CatalogoClientes catalogo, DiretorioLogins diretorio,
                          MigradorBancos migrador, ConexaoBancos conexao, @Qualifier("centralJdbc") JdbcClient central,
                          ImportadorGeografia importadorGeografia, EmpresaService empresaService,
                          UsuarioService usuarioService, UsuarioRepository usuarioRepository,
                          LeitorPlanilhaEstrutura leitorPlanilha, LeitorEstruturaBanco leitorEstrutura,
                          GravadorEstrutura gravadorEstrutura, Validator validador,
                          @Value("${app.clientes.modelo:}") String escolaModelo) {
        this.contexto = contexto;
        this.catalogo = catalogo;
        this.diretorio = diretorio;
        this.migrador = migrador;
        this.conexao = conexao;
        this.central = central;
        this.importadorGeografia = importadorGeografia;
        this.empresaService = empresaService;
        this.usuarioService = usuarioService;
        this.usuarioRepository = usuarioRepository;
        this.leitorPlanilha = leitorPlanilha;
        this.leitorEstrutura = leitorEstrutura;
        this.gravadorEstrutura = gravadorEstrutura;
        this.validador = validador;
        this.escolaModelo = escolaModelo;
    }

    public static boolean foiPedido(String... args){
        List<String> lista = Arrays.asList(args);
        return lista.contains("--" + OPCAO) || lista.contains("--" + OPCAO_SENHA) || lista.contains("--" + OPCAO_ESTRUTURA);
    }

    @Override
    public void run(ApplicationArguments args){
        if(args.containsOption(OPCAO_SENHA)){
            executarETerminar(() -> redefinirSenha(args), "Senha NÃO redefinida: ");
        } else if(args.containsOption(OPCAO_ESTRUTURA)){
            executarETerminar(() -> importarEstrutura(args), "Estrutura NÃO importada: ");
        } else if(args.containsOption(OPCAO)){
            executarETerminar(() -> {
                String bancoExistente = opcao(args, "banco-existente", false);
                if(bancoExistente == null){
                    criarClienteNovo(args);
                } else {
                    adotarBancoExistente(args, bancoExistente);
                }
            }, "Cliente NÃO cadastrado: ");
        }
    }

    // Roda o comando, mostra o erro (se houver) e encerra o backend.
    private void executarETerminar(Runnable comando, String avisoDeErro){
        int saida = 0;
        try {
            comando.run();
        } catch (RuntimeException e) {
            System.err.println();
            System.err.println(avisoDeErro + e.getMessage());
            saida = 1;
        }
        int codigoSaida = saida;
        System.exit(SpringApplication.exit(contexto, () -> codigoSaida));
    }

    private void redefinirSenha(ApplicationArguments args){
        String email = NormalizadorEmail.normalizar(opcao(args, "email", true));
        Long clienteId = diretorio.clienteDoEmail(email).orElseThrow(() -> new IllegalArgumentException(
                "O e-mail " + email + " não é login de nenhum cliente (o banco dele já foi adotado?)."));
        Cliente cliente = catalogo.buscarPorId(clienteId).orElseThrow();
        Usuario usuario = ClienteAtual.executar(clienteId, () -> usuarioRepository.findByEmailIgnoreCase(email).orElseThrow(
                () -> new IllegalArgumentException("O e-mail " + email + " está na lista central, mas não no banco do cliente.")));

        String senha = senhaProvisoria();
        // O mesmo caminho da tela Usuários: a senha nova também derruba os tokens antigos desse acesso.
        ClienteAtual.executar(clienteId, () -> usuarioService.atualizar(usuario.getId(), new AtualizarUsuarioRequest(usuario.getEmail(), senha)));

        System.out.println();
        System.out.println("Senha redefinida: " + email + " (cliente " + cliente.nome() + ")");
        System.out.println("Senha provisória: " + senha + "   (mostrada só agora; troque no primeiro acesso)");
        if(!usuario.isStAtivo()){
            System.out.println("Atenção: este acesso está bloqueado. Outro admin precisa desbloquear em Usuários.");
        }
    }

    private void criarClienteNovo(ApplicationArguments args){
        String codigo = validarCodigo(opcao(args, "codigo", true));
        String nome = opcao(args, "nome", true);
        String cnpj = opcao(args, "cnpj", true).replaceAll("\\D", "");
        String emailAdmin = NormalizadorEmail.normalizar(opcao(args, "admin-email", true));
        validarEmail(emailAdmin);
        if(cnpj.length() != 14){
            throw new IllegalArgumentException("O CNPJ deve ter 14 dígitos.");
        }
        if(diretorio.existe(emailAdmin)){
            throw new IllegalArgumentException("O e-mail " + emailAdmin + " já é login de outro cliente.");
        }
        String banco = conexao.bancoDoCodigo(codigo);
        validarCodigoEBancoLivres(codigo, banco);
        String modelo = args.containsOption("sem-modelo") ? null
                : Optional.ofNullable(opcao(args, "modelo", false)).orElse(escolaModelo);

        Cliente cliente = catalogo.inserir(codigo, nome, banco);
        boolean bancoCriado = false;
        try {
            central.sql("CREATE DATABASE \"" + banco + "\"").update();
            bancoCriado = true;
            migrador.migrarCliente(cliente);

            String senha = senhaProvisoria();
            boolean geografia = ClienteAtual.executar(cliente.id(), importadorGeografia::importarSeVazio);
            ClienteAtual.executar(cliente.id(), () -> empresaService.salvar(new EmpresaRequest(nome, cnpj)));
            ClienteAtual.executar(cliente.id(), () -> usuarioService.cadastrarAdmin(new AdminRequest(emailAdmin, senha)));
            String ficha = copiarEstrutura(modelo, cliente);

            System.out.println();
            System.out.println("Cliente cadastrado: " + nome + " (código " + codigo + ", banco " + banco + ")");
            System.out.println("Primeiro admin: " + emailAdmin);
            System.out.println("Senha provisória: " + senha + "   (mostrada só agora; troque no primeiro acesso)");
            System.out.println(ficha);
            if(!geografia){
                System.out.println("A geografia do IBGE não veio agora; ela será importada na próxima subida do backend.");
            }
        } catch (RuntimeException e) {
            diretorio.remover(emailAdmin);
            if(bancoCriado){
                central.sql("DROP DATABASE IF EXISTS \"" + banco + "\" WITH (FORCE)").update();
            }
            catalogo.excluir(cliente.id());
            throw e;
        }
    }

    // A escola nova nasce com a ficha da escola modelo: grupos, subgrupos, perguntas e faixas.
    // Alunos, avaliações e usuários da modelo não são copiados.
    private String copiarEstrutura(String codigoModelo, Cliente destino){
        if(codigoModelo == null || codigoModelo.isBlank()){
            return "Ficha: vazia (sem escola modelo). O admin monta em Estrutura da ficha ou com --importar-estrutura.";
        }
        Optional<Cliente> modelo = catalogo.buscarPorCodigo(codigoModelo.strip());
        if(modelo.isEmpty()){
            return "Ficha: vazia (a escola modelo " + codigoModelo + " não existe neste servidor).";
        }
        EstruturaAvaliacao estrutura = ClienteAtual.executar(modelo.get().id(), leitorEstrutura::ler);
        if(estrutura.vazia()){
            return "Ficha: vazia (a escola modelo " + modelo.get().nome() + " ainda não tem estrutura).";
        }
        String resumo = ClienteAtual.executar(destino.id(), () -> gravadorEstrutura.gravar(estrutura));
        return "Ficha copiada de " + modelo.get().nome() + ": " + resumo + ".";
    }

    private void importarEstrutura(ApplicationArguments args){
        String codigo = opcao(args, "codigo", true);
        Path arquivo = Path.of(opcao(args, "arquivo", true).replace("\"", ""));
        Cliente cliente = catalogo.buscarPorCodigo(codigo).orElseThrow(() ->
                new IllegalArgumentException("Não existe cliente com o código " + codigo + "."));

        LeitorPlanilhaEstrutura.Leitura leitura;
        try {
            leitura = leitorPlanilha.ler(arquivo);
        } catch (PlanilhaInvalidaException e) {
            System.err.println();
            System.err.println("Problemas na planilha:");
            e.getErros().forEach(erro -> System.err.println("  - " + erro));
            throw e;
        }
        String resumo = ClienteAtual.executar(cliente.id(), () -> gravadorEstrutura.gravar(leitura.estrutura()));

        System.out.println();
        System.out.println("Estrutura importada em " + cliente.nome() + " (código " + codigo + "): " + resumo + ".");
        if(!leitura.avisos().isEmpty()){
            System.out.println("Avisos (não impediram a importação):");
            leitura.avisos().forEach(aviso -> System.out.println("  - " + aviso));
        }
    }

    private void adotarBancoExistente(ApplicationArguments args, String banco){
        String codigo = validarCodigo(opcao(args, "codigo", true));
        String nome = opcao(args, "nome", true);
        boolean existe = central.sql("select count(*) from pg_database where datname = ?")
                .param(banco).query(Long.class).single() > 0;
        if(!existe){
            throw new IllegalArgumentException("O banco " + banco + " não existe.");
        }
        validarCodigoEBancoLivres(codigo, banco);

        Cliente cliente = catalogo.inserir(codigo, nome, banco);
        List<String> registrados = new ArrayList<>();
        try {
            migrador.migrarCliente(cliente);
            List<Usuario> usuarios = ClienteAtual.executar(cliente.id(), () -> usuarioRepository.findAll());
            for(Usuario usuario : usuarios){
                String email = NormalizadorEmail.normalizar(usuario.getEmail());
                if(diretorio.existe(email)){
                    throw new IllegalArgumentException("O e-mail " + email + " já é login de outro cliente.");
                }
                diretorio.registrar(email, cliente.id());
                registrados.add(email);
            }
            System.out.println();
            System.out.println("Banco adotado: " + banco + " agora é o cliente " + nome + " (código " + codigo + ")");
            System.out.println(registrados.size() + " login(s) colocados na lista central.");
        } catch (RuntimeException e) {
            registrados.forEach(diretorio::remover);
            catalogo.excluir(cliente.id());
            throw e;
        }
    }

    private void validarCodigoEBancoLivres(String codigo, String banco){
        if(catalogo.buscarPorCodigo(codigo).isPresent()){
            throw new IllegalArgumentException("Já existe um cliente com o código " + codigo + ".");
        }
        if(catalogo.bancoEmUso(banco)){
            throw new IllegalArgumentException("O banco " + banco + " já é de outro cliente.");
        }
    }

    // O mesmo critério do cadastro de admin pela tela (@Email do AdminRequest): assim um texto de exemplo
    // esquecido nos argumentos não vira o login do primeiro admin.
    private void validarEmail(String email){
        if(!validador.validateValue(AdminRequest.class, "email", email).isEmpty()){
            throw new IllegalArgumentException("E-mail do admin inválido: '" + email + "'. Confira o --admin-email.");
        }
    }

    // Letras minúsculas, números e hífen: o código vira parte do nome do banco.
    private static String validarCodigo(String codigo){
        if(!codigo.matches("[a-z0-9]+(-[a-z0-9]+)*") || codigo.length() < 3 || codigo.length() > 30){
            throw new IllegalArgumentException("Código inválido: use de 3 a 30 letras minúsculas, números e hífen (ex.: escola-abc).");
        }
        return codigo;
    }

    private static String opcao(ApplicationArguments args, String nome, boolean obrigatoria){
        List<String> valores = args.getOptionValues(nome);
        String valor = (valores == null || valores.isEmpty()) ? null : valores.get(0).trim();
        if(obrigatoria && (valor == null || valor.isEmpty())){
            throw new IllegalArgumentException("Falta a opção --" + nome + "=...");
        }
        return valor;
    }

    private static String senhaProvisoria(){
        byte[] bytes = new byte[9];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
