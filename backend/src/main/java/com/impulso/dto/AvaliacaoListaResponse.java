package com.impulso.dto;

import com.impulso.model.Avaliacao;

import java.time.LocalDate;
import java.time.Period;

public record AvaliacaoListaResponse(Long id, LocalDate dtAvaliacao, Integer nrIdade, Long grupoId, String nmGrupo,
                                     Long profissionalId) {

    public static AvaliacaoListaResponse de(Avaliacao avaliacao){
        int idade = Period.between(avaliacao.getAluno().getDtNascimento(), avaliacao.getDtAvaliacao()).getYears();

        return new AvaliacaoListaResponse(avaliacao.getId(), avaliacao.getDtAvaliacao(), idade, avaliacao.getGrupo().getId(),
                avaliacao.getGrupo().getNmGrupo(), avaliacao.getProfissional().getId());
    }
}
