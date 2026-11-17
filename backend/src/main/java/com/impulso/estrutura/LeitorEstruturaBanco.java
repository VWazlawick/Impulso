package com.impulso.estrutura;

import com.impulso.enums.SexoEnum;
import com.impulso.enums.TipoCalculoEnum;
import com.impulso.enums.TipoIndicadorEnum;
import com.impulso.enums.TipoRespostaEnum;
import com.impulso.estrutura.EstruturaAvaliacao.FaixaModelo;
import com.impulso.estrutura.EstruturaAvaliacao.GrupoModelo;
import com.impulso.estrutura.EstruturaAvaliacao.PerguntaModelo;
import com.impulso.estrutura.EstruturaAvaliacao.SubgrupoModelo;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// Lê a estrutura da ficha do banco do cliente atual (a escola modelo), para copiar para uma escola nova.
// Alunos, avaliações e usuários não entram: só grupos, subgrupos, perguntas e faixas.
@Component
public class LeitorEstruturaBanco {

    private final JdbcTemplate jdbc;

    public LeitorEstruturaBanco(DataSource dataSource) {
        this.jdbc = new JdbcTemplate(dataSource);
    }

    @Transactional(readOnly = true)
    public EstruturaAvaliacao ler(){
        Map<Long, List<PerguntaModelo>> perguntas = new HashMap<>();
        jdbc.query("select subgrupo_id, ds_pergunta, tp_resposta, ds_unidade from pergunta order by subgrupo_id, nr_ordem, id",
                (rs) -> {
                    perguntas.computeIfAbsent(rs.getLong("subgrupo_id"), id -> new ArrayList<>()).add(new PerguntaModelo(
                            rs.getString("ds_pergunta"), TipoRespostaEnum.valueOf(rs.getString("tp_resposta")),
                            rs.getString("ds_unidade")));
                });

        Map<Long, List<FaixaModelo>> faixasDoSubgrupo = new HashMap<>();
        List<FaixaModelo> faixasGerais = new ArrayList<>();
        jdbc.query("select tp_indicador, subgrupo_id, tp_sexo, nr_idade_min, nr_idade_max, vl_inicio, ds_classificacao "
                        + "from classificacao order by tp_indicador, subgrupo_id, tp_sexo, nr_idade_min, vl_inicio",
                (rs) -> {
                    FaixaModelo faixa = new FaixaModelo(TipoIndicadorEnum.valueOf(rs.getString("tp_indicador")),
                            SexoEnum.valueOf(rs.getString("tp_sexo")), rs.getInt("nr_idade_min"), rs.getInt("nr_idade_max"),
                            rs.getBigDecimal("vl_inicio"), rs.getString("ds_classificacao"));
                    long subgrupoId = rs.getLong("subgrupo_id");
                    if(rs.wasNull()){
                        faixasGerais.add(faixa);
                    } else {
                        faixasDoSubgrupo.computeIfAbsent(subgrupoId, id -> new ArrayList<>()).add(faixa);
                    }
                });

        Map<Long, List<SubgrupoModelo>> subgrupos = new HashMap<>();
        jdbc.query("select id, grupo_id, nm_subgrupo, tp_calculo from subgrupo order by grupo_id, nr_ordem, id",
                (rs) -> {
                    long id = rs.getLong("id");
                    subgrupos.computeIfAbsent(rs.getLong("grupo_id"), grupoId -> new ArrayList<>()).add(new SubgrupoModelo(
                            rs.getString("nm_subgrupo"), TipoCalculoEnum.valueOf(rs.getString("tp_calculo")),
                            perguntas.getOrDefault(id, List.of()), faixasDoSubgrupo.getOrDefault(id, List.of())));
                });

        List<GrupoModelo> grupos = jdbc.query("select id, nm_grupo, nr_idade_min, nr_idade_max from grupo order by nr_idade_min, id",
                (rs, linha) -> new GrupoModelo(rs.getString("nm_grupo"), rs.getInt("nr_idade_min"), rs.getInt("nr_idade_max"),
                        subgrupos.getOrDefault(rs.getLong("id"), List.of())));

        return new EstruturaAvaliacao(grupos, faixasGerais);
    }
}
