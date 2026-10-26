package com.impulso.dto;

import com.impulso.utils.ConversorMedida;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AvaliacaoRequest(
        @NotNull(message = "A data de avaliação é obrigatória!")
        LocalDate dtAvaliacao,
        @DecimalMin(value = "0", inclusive = false, message = "O peso deve ser maior que zero!")
        @Digits(integer = 3, fraction = 2, message = "O peso aceita até 3 dígitos inteiros e 2 decimais!")
        BigDecimal vlPeso,
        @DecimalMin(value = "30", message = "Estatura inválida: informe em centímetros (135) ou em metros (1.35)!")
        @Digits(integer = 3, fraction = 2, message = "A estatura aceita até 3 dígitos inteiros e 2 decimais!")
        BigDecimal vlEstatura,
        @DecimalMin(value = "20", message = "Cintura inválida: informe em centímetros (60) ou em metros (0.60)!")
        @Digits(integer = 3, fraction = 2, message = "A cintura aceita até 3 dígitos inteiros e 2 decimais!")
        BigDecimal vlCintura,
        @NotEmpty(message = "Informe pelo menos uma resposta!")
        List<@Valid RespostaRequest> respostas
) {

        public AvaliacaoRequest{
                vlEstatura = ConversorMedida.paraCentimetros(vlEstatura);
                vlCintura = ConversorMedida.paraCentimetros(vlCintura);
        }
}
