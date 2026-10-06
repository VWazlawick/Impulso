package com.impulso.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ProfissionalRequest(
        @NotBlank(message = "O nome do Profissional é obrigatório!") String nmPessoa,
        @NotBlank(message = "O CPF do Profissional é obrigatório")
        @Pattern(regexp = "\\d{11}", message = "O CPF deve ter 11 dígitos, sem pontuação") String cpf,
        @Email(message = "Email Inválido") String email) {
}
