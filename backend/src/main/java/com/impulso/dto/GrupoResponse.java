package com.impulso.dto;

import com.impulso.model.Grupo;

public record GrupoResponse(Long id, String nmGrupo, Integer nrIdadeMin, Integer nrIdadeMax) {

    public static GrupoResponse de(Grupo grupo){
        return new GrupoResponse(grupo.getId(), grupo.getNmGrupo(), grupo.getNrIdadeMin(), grupo.getNrIdadeMax());
    }
}
