package com.impulso.dto;

import com.impulso.enums.TipoCalculoEnum;

import java.util.List;

public record EvolucaoIndicadorResponse(String nmSubgrupo, TipoCalculoEnum tpCalculo, List<EvolucaoPontoResponse> pontos,
                                        String dsUnidade) {
}
