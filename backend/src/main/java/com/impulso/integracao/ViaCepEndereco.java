package com.impulso.integracao;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ViaCepEndereco(
        @JsonProperty("logradouro") String rua,
        String bairro,
        @JsonProperty("localidade") String nmCidade,
        @JsonProperty("uf") String sgEstado,
        @JsonProperty("ibge") String cdIbge,
        String erro
) {
}
