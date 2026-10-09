package com.impulso.integracao;

import com.fasterxml.jackson.annotation.JsonProperty;

public record IbgeMunicipio(Long id, @JsonProperty("nome") String nmMunicipio) {
}
