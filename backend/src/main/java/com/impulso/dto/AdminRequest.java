package com.impulso.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminRequest(
        @NotBlank(message = "Email obrigatório!")
        @Email(message = "Email inválido!") String email,
        @NotBlank(message = "Informe a senha!")
        @Size(min=8, message = "A senha deve ter no mínimo 8 caractereces!") String senha
) {
}
