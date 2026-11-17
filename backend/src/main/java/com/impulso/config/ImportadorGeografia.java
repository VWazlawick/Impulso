package com.impulso.config;

import com.impulso.integracao.IbgeClient;
import com.impulso.integracao.IbgeEstado;
import com.impulso.integracao.IbgeMunicipio;
import com.impulso.model.Cidade;
import com.impulso.model.Estado;
import com.impulso.model.Pais;
import com.impulso.repository.CidadeRepository;
import com.impulso.repository.EstadoRepository;
import com.impulso.repository.PaisRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// Importa país, estados e cidades do IBGE no banco do cliente atual, se ainda estiver vazio.
// Usado na subida do backend (GeografiaInicial) e no cadastro de cliente novo (ComandoCliente).
@Component
public class ImportadorGeografia {

    private static final Logger log = LoggerFactory.getLogger(ImportadorGeografia.class);

    private final IbgeClient ibgeClient;
    private final PaisRepository paisRepository;
    private final EstadoRepository estadoRepository;
    private final CidadeRepository cidadeRepository;

    public ImportadorGeografia(IbgeClient ibgeClient, PaisRepository paisRepository,
                               EstadoRepository estadoRepository, CidadeRepository cidadeRepository) {
        this.ibgeClient = ibgeClient;
        this.paisRepository = paisRepository;
        this.estadoRepository = estadoRepository;
        this.cidadeRepository = cidadeRepository;
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

        cidadeRepository.saveAll(cidades);

        log.info("Geografia importada do IBGE: {} estados e {} cidades", dados.size(), cidades.size());
        return true;
    }
}
