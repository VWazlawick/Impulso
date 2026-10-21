package com.impulso.dto;

import com.impulso.enums.TipoRespostaEnum;
import com.impulso.model.Pergunta;

public record PerguntaResponse(Long id, String dsPergunta, TipoRespostaEnum tpResposta, String dsUnidade, Integer nrOrdem) {

    public static PerguntaResponse de(Pergunta pergunta){
        return new PerguntaResponse(pergunta.getId(), pergunta.getDsPergunta(), pergunta.getTpResposta(),
                pergunta.getDsUnidade(), pergunta.getNrOrdem());
    }
}
