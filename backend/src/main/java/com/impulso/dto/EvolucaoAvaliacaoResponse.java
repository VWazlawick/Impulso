package com.impulso.dto;

import com.impulso.model.Avaliacao;

import java.time.LocalDate;

public record EvolucaoAvaliacaoResponse(Long avaliacaoId, LocalDate dtAvaliacao, Integer nrIdade, String nmGrupo,
                                        MedidasResponse medidas) {

    public static EvolucaoAvaliacaoResponse de(Avaliacao avaliacao){
        return new EvolucaoAvaliacaoResponse(avaliacao.getId(), avaliacao.getDtAvaliacao(), avaliacao.calcularIdade(),
                avaliacao.getGrupo().getNmGrupo(), MedidasResponse.de(avaliacao));
    }
}
