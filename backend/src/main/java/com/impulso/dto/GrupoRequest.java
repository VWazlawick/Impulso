package com.impulso.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GrupoRequest(
        @NotBlank(message = "O nome do grupo é obrigatório!")
        @Size(max = 50, message = "O nome do grupo deve ter no máximo 50 caracteres!")
        String nmGrupo,
        @NotNull(message = "A idade mínima é obrigatória!")
        @Min(value = 0, message = "A idade mínima não pode ser negativa!")
        Integer nrIdadeMin,
        @NotNull(message = "A idade máxima é obrigatória!")
        @Min(value = 0, message = "A idade máxima não pode ser negativa!")
        Integer nrIdadeMax
) {
}
