package com.impulso.dto;

import com.impulso.enums.TipoRespostaEnum;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PerguntaRequest(
        @NotBlank(message = "O texto da pergunta é obrigatório!")
        @Size(max=255, message = "A pergunta não pode ter mais que 255 caracteres!")
        String dsPergunta,
        @NotNull(message = "O tipo da resposta é obrigatório!")
        TipoRespostaEnum tpResposta,
        @Size(max = 20, message = "A unidade deve ter no máximo 20 caracteres!")
        String dsUnidade,
        @NotNull(message = "A ordem é obrigatória!")
        @Min(value = 1, message = "A ordem tem que ser maior que 0!")
        Integer nrOrdem
) {
}
