package com.impulso.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UsuarioRequest(
        @NotNull(message = "A Pessoa é obrigatória para o Usuário!") Long pessoaId,
        @NotBlank(message = "Email obrigatório")
        @Email(message = "Email inválido!") String email,
        @NotBlank(message = "Informe a senha!")
        @Size(min = 8, message = "A Senha deve ter no mínimo 8 caracteres!") String senha
) {
}
