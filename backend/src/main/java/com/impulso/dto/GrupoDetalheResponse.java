package com.impulso.dto;

import com.impulso.model.Grupo;

import java.util.List;

public record GrupoDetalheResponse(Long id, String nmGrupo, Integer nrIdadeMin, Integer nrIdadeMax,
                                   List<SubgrupoResponse> subgrupos) {

    public static GrupoDetalheResponse de(Grupo grupo){
        return new GrupoDetalheResponse(grupo.getId(), grupo.getNmGrupo(), grupo.getNrIdadeMin(), grupo.getNrIdadeMax(),
                grupo.getSubgrupos().stream().map(SubgrupoResponse::de).toList());
    }
}
