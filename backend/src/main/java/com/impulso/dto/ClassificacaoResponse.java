package com.impulso.dto;

import com.impulso.enums.SexoEnum;
import com.impulso.enums.TipoIndicadorEnum;
import com.impulso.model.Classificacao;
import com.impulso.model.Subgrupo;

import java.math.BigDecimal;

public record ClassificacaoResponse(Long id, TipoIndicadorEnum tpIndicador, Long subgrupoId, String nmSubgrupo,
                                   SexoEnum tpSexo, Integer nrIdadeMin, Integer nrIdadeMax, BigDecimal vlInicio,
                                   String dsClassificacao) {

    public static ClassificacaoResponse de(Classificacao classificacao){
        Subgrupo subgrupo = classificacao.getSubgrupo();

        return new ClassificacaoResponse(classificacao.getId(), classificacao.getTpIndicador(),
                subgrupo == null ? null : subgrupo.getId(), subgrupo == null ? null : subgrupo.getNmSubgrupo(),
                classificacao.getTpSexo(), classificacao.getNrIdadeMin(), classificacao.getNrIdadeMax(),
                classificacao.getVlInicio(), classificacao.getDsClassificacao());
    }
}
