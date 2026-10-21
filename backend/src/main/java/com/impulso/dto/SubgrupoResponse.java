package com.impulso.dto;

import com.impulso.enums.TipoCalculoEnum;
import com.impulso.model.Subgrupo;

import java.util.List;

public record SubgrupoResponse(Long id, String nmSubgrupo, TipoCalculoEnum tpCalculo, Integer nrOrdem,
                               List<PerguntaResponse> perguntas) {

    public static SubgrupoResponse de(Subgrupo subgrupo){
        return new SubgrupoResponse(subgrupo.getId(), subgrupo.getNmGrupo(), subgrupo.getTpCalculo(), subgrupo.getNrOrdem(),
                subgrupo.getPerguntas().stream().map(PerguntaResponse::de).toList());
    }
}
