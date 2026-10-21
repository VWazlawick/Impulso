package com.impulso.dto;

import com.impulso.enums.TipoCalculoEnum;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SubgrupoRequest(
        @NotBlank(message = "O nome do subgrupo é obrigatório !")
        @Size(max = 100, message = "O nome do subgrupo deve ter no máximo 100 caracteres!") String nmSubgrupo,
        @NotNull(message = "O tipo de cálculo é obrigatório!")TipoCalculoEnum tpCalculo,
        @NotNull(message = "A ordem é obrigatória!")
        @Min(value = 1, message = "A ordem tem que ser maior que 0!") Integer nrOrdem
        ) {
}
