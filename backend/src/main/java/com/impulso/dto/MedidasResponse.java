package com.impulso.dto;

import com.impulso.model.Avaliacao;

import java.math.BigDecimal;

public record MedidasResponse(BigDecimal vlPeso, BigDecimal vlEstatura, BigDecimal vlCintura, BigDecimal vlImc, BigDecimal vlRce,
                              String dsClassificacaoImc, String dsClassificacaoRce) {

    public static MedidasResponse de(Avaliacao avaliacao, String dsClassificacaoImc, String dsClassificacaoRce){
        return new MedidasResponse(avaliacao.getVlPeso(), avaliacao.getVlEstatura(), avaliacao.getVlCintura(),
                avaliacao.calcularImc(), avaliacao.calcularRce(), dsClassificacaoImc, dsClassificacaoRce);
    }
}
