package com.impulso.dto;

import com.impulso.enums.EstagioEnum;
import com.impulso.model.Avaliacao;
import com.impulso.model.AvaliacaoResumo;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EvolucaoPontoResponse(Long avaliacaoId, LocalDate dtAvaliacao, Integer nrIdade, BigDecimal vlResultado,
                                    EstagioEnum tpEstagio, String dsClassificacao) {

    public static EvolucaoPontoResponse de(AvaliacaoResumo resumo, String dsClassificacao){
        Avaliacao avaliacao = resumo.getAvaliacao();
        return new EvolucaoPontoResponse(avaliacao.getId(), avaliacao.getDtAvaliacao(), avaliacao.calcularIdade(),
                resumo.getVlResultado(), resumo.getTpEstagio(), dsClassificacao);
    }
}
