package com.impulso.dto;

import com.impulso.enums.SexoEnum;
import com.impulso.enums.TipoIndicadorEnum;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ClassificacaoRequest(
        @NotNull(message = "O indicador é obrigatório!")
        TipoIndicadorEnum tpIndicador,
        Long subgrupoId,
        @NotNull(message = "O sexo é obrigatório!")
        SexoEnum tpSexo,
        @NotNull(message = "A idade mínima é obrigatória!")
        @Min(value = 0, message = "A idade mínima não pode ser negativa!")
        Integer nrIdadeMin,
        @NotNull(message = "A idade máxima é obrigatória!")
        @Min(value = 0, message = "A idade máxima não pode ser negativa!")
        Integer nrIdadeMax,
        @NotNull(message = "O valor inicial da faixa é obrigatório!")
        @DecimalMin(value = "0", message = "O valor inicial não pode ser negativo!")
        @Digits(integer = 6, fraction = 2, message = "O valor inicial aceita até 6 dígitos inteiros e 2 decimais!")
        BigDecimal vlInicio,
        @NotBlank(message = "A classificação é obrigatória!")
        @Size(max = 30, message = "A classificação deve ter no máximo 30 caracteres!")
        String dsClassificacao
) {
}
