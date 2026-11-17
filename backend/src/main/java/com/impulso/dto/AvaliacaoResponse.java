package com.impulso.dto;

import com.impulso.model.Avaliacao;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;

public record AvaliacaoResponse(Long id, LocalDate dtAvaliacao, Long alunoId, String nmAluno, Integer nrIdade,
                                Long profissionalId, Long grupoId, String nmGrupo, String dsLocal, Integer nrDuracao,
                                MedidasResponse medidas, List<RespostaResponse> respostas, List<ResultadoResponse> resultados) {

    public static AvaliacaoResponse de(Avaliacao avaliacao, MedidasResponse medidas, List<ResultadoResponse> resultados){
        int idade = Period.between(avaliacao.getAluno().getDtNascimento(), avaliacao.getDtAvaliacao()).getYears();

        return new AvaliacaoResponse(avaliacao.getId(), avaliacao.getDtAvaliacao(), avaliacao.getAluno().getId(),
                avaliacao.getAluno().getNmPessoa(), idade, avaliacao.getProfissional().getId(), avaliacao.getGrupo().getId(),
                avaliacao.getGrupo().getNmGrupo(), avaliacao.getDsLocal(), avaliacao.getNrDuracao(),
                medidas,
                avaliacao.getRespostas().stream().map(RespostaResponse::de).toList(), resultados);
    }
}
