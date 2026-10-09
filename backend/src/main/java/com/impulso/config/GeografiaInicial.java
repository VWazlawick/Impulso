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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class GeografiaInicial implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(GeografiaInicial.class);

    private final IbgeClient ibgeClient;
    private final PaisRepository paisRepository;
    private final EstadoRepository estadoRepository;
    private final CidadeRepository cidadeRepository;
    private final boolean importar;

    public GeografiaInicial(IbgeClient ibgeClient, PaisRepository paisRepository,
                            EstadoRepository estadoRepository, CidadeRepository cidadeRepository,
                            @Value("${app.ibge.importar}") boolean importar) {
        this.ibgeClient = ibgeClient;
        this.paisRepository = paisRepository;
        this.estadoRepository = estadoRepository;
        this.cidadeRepository = cidadeRepository;
        this.importar = importar;
    }

    @Override
    @Transactional
    public void run(String... args){
        if(!importar || paisRepository.count() > 0){
            return;
        }

        Map<IbgeEstado, List<IbgeMunicipio>> dados = new LinkedHashMap<>();
        try{
            for(IbgeEstado estado : ibgeClient.buscarEstados()){
                dados.put(estado, ibgeClient.buscarCidades(estado.sgEstado()));
            }
        }
        catch (RestClientException e){
            log.warn("Não foi possível importar a geografia do IBGE: {}. A importação será tentada na próxima inicialização!", e.getMessage());
            return;
        }

        Pais brasil = paisRepository.save(new Pais("Brasil", "BR"));
        List<Cidade> cidades = new ArrayList<>();
        dados.forEach((ibgeEstado, municipios) -> {
            Estado estado = estadoRepository.save(new Estado(ibgeEstado.nmEstado(), ibgeEstado.sgEstado(), brasil));
            municipios.forEach(m -> cidades.add(new Cidade(m.nmMunicipio(), estado)));
        });

        cidadeRepository.saveAll(cidades);

        log.info("Geografia importada do IBGE: {} estados e {} cidades", dados.size(), cidades.size());
    }
}
