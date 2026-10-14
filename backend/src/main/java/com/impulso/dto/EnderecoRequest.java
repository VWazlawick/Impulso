package com.impulso.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EnderecoRequest(
        @NotBlank(message = "A rua é obrigatória!")
        @Size(max = 150, message = "A rua deve ter no máximo 150 caracteres!") String rua,
        @NotBlank(message = "O número é obrigatório!")
        @Size(max = 20, message = "O número deve ter no máximo 20 caracteres!") String nrCasa,
        @NotBlank(message = "O bairro é obrigatório!")
        @Size(max = 100, message = "O bairro deve ter no máximo 100 caracteres!") String bairro,
        @NotBlank(message = "O CEP é obrigatório!")
        @Pattern(regexp = "\\d{8}", message = "O CEP deve ter 8 digitos!") String cep,
        @Size(max = 100, message = "O complemento deve ter no máximo 100 caracteres!") String complemento,
        @NotNull(message = "A cidade é obrigatória!") Long cidadeId
) {
}
