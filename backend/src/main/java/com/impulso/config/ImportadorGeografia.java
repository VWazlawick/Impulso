package com.impulso.config;

import com.impulso.integracao.IbgeClient;
import com.impulso.integracao.IbgeEstado;
import com.impulso.integracao.IbgeMunicipio;
import com.impulso.model.Cidade;
import com.impulso.model.Estado;
import com.impulso.model.Pais;
import com.impulso.repository.EstadoRepository;
import com.impulso.repository.PaisRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// Importa país, estados e cidades do IBGE no banco do cliente atual, se ainda estiver vazio.
// Usado na subida do backend (GeografiaInicial) e no cadastro de cliente novo (ComandoCliente).
@Component
public class ImportadorGeografia {

    private static final Logger log = LoggerFactory.getLogger(ImportadorGeografia.class);

    private static final int CIDADES_POR_LOTE = 1000;

    private final IbgeClient ibgeClient;
    private final PaisRepository paisRepository;
    private final EstadoRepository estadoRepository;
    private final JdbcTemplate jdbc;

    // O DataSource principal é o do cliente atual (BancoDosClientes): o JdbcTemplate usa a mesma
    // conexão e a mesma transação do JPA.
    public ImportadorGeografia(IbgeClient ibgeClient, PaisRepository paisRepository,
                               EstadoRepository estadoRepository, DataSource dataSource) {
        this.ibgeClient = ibgeClient;
        this.paisRepository = paisRepository;
        this.estadoRepository = estadoRepository;
        this.jdbc = new JdbcTemplate(dataSource);
    }

    // Devolve true se a geografia está no banco (já estava ou acabou de ser importada).
    @Transactional
    public boolean importarSeVazio(){
        if(paisRepository.count() > 0){
            return true;
        }

        Map<IbgeEstado, List<IbgeMunicipio>> dados = new LinkedHashMap<>();
        try{
            for(IbgeEstado estado : ibgeClient.buscarEstados()){
                dados.put(estado, ibgeClient.buscarCidades(estado.sgEstado()));
            }
        }
        catch (RestClientException e){
            log.warn("Não foi possível importar a geografia do IBGE: {}. A importação será tentada na próxima inicialização!", e.getMessage());
            return false;
        }

        Pais brasil = paisRepository.save(new Pais("Brasil", "BR"));
        List<Cidade> cidades = new ArrayList<>();
        dados.forEach((ibgeEstado, municipios) -> {
            Estado estado = estadoRepository.save(new Estado(ibgeEstado.nmEstado(), ibgeEstado.sgEstado(), brasil));
            municipios.forEach(m -> cidades.add(new Cidade(m.nmMunicipio(), m.id(),estado)));
        });
        // Os estados precisam estar no banco antes das cidades, que apontam para eles.
        estadoRepository.flush();

        // As cidades (mais de 5 mil) vão em lote. Pelo JPA seria um INSERT por cidade, cada um com
        // uma ida e volta ao banco (o id gerado pelo banco impede o Hibernate de agrupar): com o banco
        // longe, como o Neon nos EUA visto do Brasil (~140 ms), isso levaria uns 13 minutos.
        jdbc.batchUpdate("INSERT INTO cidade (nm_cidade, cd_ibge, estado_id) VALUES (?, ?, ?)",
                cidades, CIDADES_POR_LOTE, (comando, cidade) -> {
                    comando.setString(1, cidade.getNmCidade());
                    comando.setLong(2, cidade.getCdIbge());
                    comando.setLong(3, cidade.getEstado().getId());
                });

        log.info("Geografia importada do IBGE: {} estados e {} cidades", dados.size(), cidades.size());
        return true;
    }
}
