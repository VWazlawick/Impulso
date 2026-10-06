package com.impulso.dto;

import java.util.Map;

public record ErroValidacaoResponse(String erro, Map<String, String> campos) {
}
