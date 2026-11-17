package com.impulso.estrutura;

import com.impulso.estrutura.EstruturaAvaliacao.FaixaModelo;
import com.impulso.estrutura.EstruturaAvaliacao.GrupoModelo;
import com.impulso.estrutura.EstruturaAvaliacao.PerguntaModelo;
import com.impulso.estrutura.EstruturaAvaliacao.SubgrupoModelo;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

// Grava a estrutura da ficha no banco do cliente atual, numa transação só: ou entra tudo, ou nada.
// Só grava numa escola sem estrutura (sem grupos nem faixas), para nunca misturar duas estruturas.
// Grupos e subgrupos vão um a um (os filhos precisam do id deles); perguntas e faixas vão em lote,
// o que importa quando o banco está longe (o comando roda no computador e o Neon fica nos EUA).
@Component
public class GravadorEstrutura {

    private final JdbcTemplate jdbc;

    // O DataSource principal é o do cliente atual (BancoDosClientes): mesma conexão e mesma transação.
    public GravadorEstrutura(DataSource dataSource) {
        this.jdbc = new JdbcTemplate(dataSource);
    }

    @Transactional
    public String gravar(EstruturaAvaliacao estrutura){
        Long existentes = jdbc.queryForObject(
                "select (select count(*) from grupo) + (select count(*) from classificacao)", Long.class);
        if(existentes != null && existentes > 0){
            throw new IllegalStateException("esta escola já tem estrutura da ficha (grupos ou faixas cadastrados). "
                    + "A importação só grava numa estrutura vazia.");
        }

        List<Object[]> perguntas = new ArrayList<>();
        List<Object[]> faixas = new ArrayList<>();
        for(GrupoModelo grupo : estrutura.grupos()){
            Long grupoId = jdbc.queryForObject(
                    "insert into grupo (nm_grupo, nr_idade_min, nr_idade_max) values (?, ?, ?) returning id",
                    Long.class, grupo.nome(), grupo.idadeMin(), grupo.idadeMax());
            int ordemSubgrupo = 1;
            for(SubgrupoModelo subgrupo : grupo.subgrupos()){
                Long subgrupoId = jdbc.queryForObject(
                        "insert into subgrupo (nm_subgrupo, tp_calculo, nr_ordem, grupo_id) values (?, ?, ?, ?) returning id",
                        Long.class, subgrupo.nome(), subgrupo.calculo().name(), ordemSubgrupo++, grupoId);
                int ordemPergunta = 1;
                for(PerguntaModelo pergunta : subgrupo.perguntas()){
                    perguntas.add(new Object[]{pergunta.texto(), pergunta.tipo().name(), pergunta.unidade(), ordemPergunta++, subgrupoId});
                }
                for(FaixaModelo faixa : subgrupo.faixas()){
                    faixas.add(linhaDaFaixa(faixa, subgrupoId));
                }
            }
        }
        for(FaixaModelo faixa : estrutura.faixasGerais()){
            faixas.add(linhaDaFaixa(faixa, null));
        }

        jdbc.batchUpdate("insert into pergunta (ds_pergunta, tp_resposta, ds_unidade, nr_ordem, subgrupo_id) values (?, ?, ?, ?, ?)",
                perguntas, new int[]{Types.VARCHAR, Types.VARCHAR, Types.VARCHAR, Types.INTEGER, Types.BIGINT});
        jdbc.batchUpdate("insert into classificacao (tp_indicador, subgrupo_id, tp_sexo, nr_idade_min, nr_idade_max, vl_inicio, "
                        + "ds_classificacao) values (?, ?, ?, ?, ?, ?, ?)",
                faixas, new int[]{Types.VARCHAR, Types.BIGINT, Types.VARCHAR, Types.INTEGER, Types.INTEGER, Types.NUMERIC, Types.VARCHAR});

        return estrutura.resumo();
    }

    private static Object[] linhaDaFaixa(FaixaModelo faixa, Long subgrupoId){
        return new Object[]{faixa.indicador().name(), subgrupoId, faixa.sexo().name(), faixa.idadeMin(), faixa.idadeMax(),
                faixa.inicio(), faixa.classificacao()};
    }
}
