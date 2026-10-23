package com.impulso.dto;

import com.impulso.enums.TipoOpcaoEnum;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record RespostaRequest(
        @NotNull(message = "A pergunta é obrigatória!")
        Long perguntaId,
        @DecimalMin(value = "0", message = "O valor não pode ser negativo!")
        @Digits(integer = 6, fraction = 2, message = "O valor aceita até 6 dígitos inteiros e 2 decimais!")
        BigDecimal vlResposta,
        TipoOpcaoEnum tpOpcao
) {
}
