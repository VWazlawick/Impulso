package com.impulso.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record EmpresaRequest(
        @NotBlank(message = "A razão social é obrigatória") String razaoSocial,
        @NotBlank(message = "O CNPJ é obrigatório")
        @Pattern(regexp = "\\d{14}", message = "O CNPJ deve ter 14 dígitos, sem pontuação") String cnpj) {
}
