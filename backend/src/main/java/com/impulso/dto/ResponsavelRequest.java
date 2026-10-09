package com.impulso.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResponsavelRequest(
        @NotBlank(message = "O nome do Responsável é obrigatório") String nmPessoa,
        @NotBlank(message = "Telefone é obrigatório!")
        @Pattern(regexp="\\d{10,11}", message = "O telefone deve ter DDD + número, só digitos") String nrTelefone
) {
}
