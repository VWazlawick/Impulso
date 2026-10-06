package com.impulso.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResponsavelRequest(
        @NotBlank(message = "O nome do Responsável é obrigatório") String nmPessoa,
        @NotBlank(message = "O CPF do Responsável é obrigatório")
        @Pattern(regexp = "\\d{11}", message = "O CPF deve ter 11 dígitos, sem pontuação") String cpf,
        @Email(message = "Email inválido") String email
) {
}
