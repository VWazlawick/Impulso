package com.impulso.integracao;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Component
public class ViaCepClient {

    private final RestClient restClient;

    public ViaCepClient(RestClient.Builder builder, @Value("${app.viacep.url}") String url){
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(3));
        fabrica.setReadTimeout(Duration.ofSeconds(5));
        this.restClient = builder.baseUrl(url).requestFactory(fabrica).build();
    }

    public ViaCepEndereco buscar(String cep){
        return restClient.get()
                .uri("/{cep}/json/", cep)
                .retrieve()
                .body(ViaCepEndereco.class);
    }
}
