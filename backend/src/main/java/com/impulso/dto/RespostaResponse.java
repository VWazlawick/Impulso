package com.impulso.dto;

import com.impulso.enums.TipoOpcaoEnum;
import com.impulso.model.Resposta;

import java.math.BigDecimal;

public record RespostaResponse(Long perguntaId, String dsPergunta, BigDecimal vlResposta, TipoOpcaoEnum tpOpcao) {

    public static RespostaResponse de(Resposta resposta){
        return new RespostaResponse(resposta.getPergunta().getId(), resposta.getPergunta().getDsPergunta(),
                resposta.getVlResposta(), resposta.getTpOpcao());
    }
}
