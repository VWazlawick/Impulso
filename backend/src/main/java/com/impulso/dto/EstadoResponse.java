package com.impulso.dto;

import com.impulso.model.Estado;

public record EstadoResponse(Long id, String nmEstado, String sgEstado) {

    public static EstadoResponse de(Estado estado){
        return new EstadoResponse(estado.getId(), estado.getNmEstado(), estado.getSgEstado());
    }
}
