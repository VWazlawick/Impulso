package com.impulso.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AtualizarUsuarioRequest(
        @NotBlank(message = "O email é obrigatório!")
        @Email(message = "Email inválido!") String email,
        @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres!") String senha
) {
}
