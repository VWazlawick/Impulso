package com.impulso.integracao;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
public class IbgeClient {

    private final RestClient restClient;

    public IbgeClient(RestClient.Builder builder, @Value("${app.ibge.url}") String url){
        this.restClient = builder.baseUrl(url).build();
    }

    public List<IbgeEstado> buscarEstados(){
        IbgeEstado[] estados = restClient.get()
                .uri("/estados?orderBy=nome")
                .retrieve()
                .body(IbgeEstado[].class);
        return List.of(estados);
    }

    public List<IbgeMunicipio> buscarCidades(String sgEstado){
        IbgeMunicipio[] cidades = restClient.get()
                .uri("/estados/{uf}/municipios?orderBy=nome", sgEstado)
                .retrieve()
                .body(IbgeMunicipio[].class);
        return List.of(cidades);
    }
}
