package com.impulso.dto;

import com.impulso.model.Cidade;

public record CidadeResponse(Long id, String nmCidade) {

    public static CidadeResponse de(Cidade cidade){
        return new CidadeResponse(cidade.getId(), cidade.getNmCidade());
    }
}
