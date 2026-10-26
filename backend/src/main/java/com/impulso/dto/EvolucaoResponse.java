package com.impulso.dto;

import java.util.List;

public record EvolucaoResponse(Long alunoId, String nmAluno, List<EvolucaoAvaliacaoResponse> avaliacoes,
                               List<EvolucaoIndicadorResponse> indicadores) {

}
