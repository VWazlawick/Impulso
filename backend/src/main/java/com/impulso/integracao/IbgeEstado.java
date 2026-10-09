package com.impulso.integracao;

import com.fasterxml.jackson.annotation.JsonProperty;

public record IbgeEstado(Long id, @JsonProperty("nome") String nmEstado, @JsonProperty("sigla") String sgEstado) {
}
