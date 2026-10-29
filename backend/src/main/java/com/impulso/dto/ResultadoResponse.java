package com.impulso.dto;

import com.impulso.enums.EstagioEnum;
import com.impulso.enums.TipoCalculoEnum;
import com.impulso.model.AvaliacaoResumo;

import java.math.BigDecimal;

public record ResultadoResponse(Long subgrupoId, String nmSubgrupo, TipoCalculoEnum tpCalculo, BigDecimal vlResultado,
                                EstagioEnum tpEstagio, String dsClassificacao) {

    public static ResultadoResponse de(AvaliacaoResumo resumo, String dsClassificacao){
        return new ResultadoResponse(resumo.getSubgrupo().getId(), resumo.getSubgrupo().getNmSubgrupo(),
                resumo.getSubgrupo().getTpCalculo(), resumo.getVlResultado(), resumo.getTpEstagio(), dsClassificacao);
    }
}
