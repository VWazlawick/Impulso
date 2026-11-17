package com.impulso.estrutura;

import com.impulso.enums.SexoEnum;
import com.impulso.enums.TipoCalculoEnum;
import com.impulso.enums.TipoIndicadorEnum;
import com.impulso.enums.TipoRespostaEnum;

import java.math.BigDecimal;
import java.util.List;

// A estrutura da ficha de uma escola, fora do banco: grupos > subgrupos > perguntas, com as faixas de
// classificação de cada subgrupo e as faixas gerais (IMC e RCE). Vem da planilha de importação ou do
// banco da escola modelo, e o GravadorEstrutura grava tudo de uma vez numa escola sem estrutura.
// O conteúdo (testes, critérios, tabelas) nunca fica no código: só passa por aqui.
public record EstruturaAvaliacao(List<GrupoModelo> grupos, List<FaixaModelo> faixasGerais) {

    public record GrupoModelo(String nome, int idadeMin, int idadeMax, List<SubgrupoModelo> subgrupos) {
    }

    public record SubgrupoModelo(String nome, TipoCalculoEnum calculo, List<PerguntaModelo> perguntas,
                                 List<FaixaModelo> faixas) {
    }

    public record PerguntaModelo(String texto, TipoRespostaEnum tipo, String unidade) {
    }

    // Indicador SUBGRUPO nas faixas de um subgrupo; IMC ou RCE nas faixas gerais.
    // "A partir de inicio, o resultado é classificacao", para um sexo e uma faixa de idade.
    public record FaixaModelo(TipoIndicadorEnum indicador, SexoEnum sexo, int idadeMin, int idadeMax,
                              BigDecimal inicio, String classificacao) {
    }

    public boolean vazia(){
        return grupos.isEmpty() && faixasGerais.isEmpty();
    }

    public String resumo(){
        long subgrupos = grupos.stream().mapToLong(grupo -> grupo.subgrupos().size()).sum();
        long perguntas = grupos.stream().flatMap(grupo -> grupo.subgrupos().stream())
                .mapToLong(subgrupo -> subgrupo.perguntas().size()).sum();
        long faixas = faixasGerais.size() + grupos.stream().flatMap(grupo -> grupo.subgrupos().stream())
                .mapToLong(subgrupo -> subgrupo.faixas().size()).sum();
        return grupos.size() + " grupo(s), " + subgrupos + " subgrupo(s), " + perguntas + " pergunta(s) e "
                + faixas + " faixa(s) de classificação";
    }
}
