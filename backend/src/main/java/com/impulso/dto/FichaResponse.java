package com.impulso.dto;

import com.impulso.model.Aluno;
import com.impulso.model.Grupo;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FichaResponse(Long alunoId, String nmAluno, LocalDate dtAvaliacao, Integer nrIdade, BigDecimal vlPeso, BigDecimal vlEstatura,
                            BigDecimal vlCintura, GrupoDetalheResponse grupo) {

    public static FichaResponse de(Aluno aluno, LocalDate dtAvaliacao, Integer nrIdade, Grupo grupo){
        return new FichaResponse(aluno.getId(), aluno.getNmPessoa(), dtAvaliacao, nrIdade, aluno.getVlPeso(), aluno.getVlEstatura(),
                aluno.getVlCintura(),GrupoDetalheResponse.de(grupo));
    }
}
