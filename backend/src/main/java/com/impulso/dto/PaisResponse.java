package com.impulso.dto;

import com.impulso.model.Pais;

public record PaisResponse(Long id, String nmPais, String sgPais) {

    public static PaisResponse de(Pais pais){
        return new PaisResponse(pais.getId(), pais.getNmPais(), pais.getSgPais());
    }
}
