package com.impulso.dto;

import com.impulso.model.Responsavel;

public record ResponsavelResponse(Long id, String nmPessoa, String nrTelefone, boolean possuiAcesso) {
    public static ResponsavelResponse de(Responsavel responsavel){
        return new ResponsavelResponse(
                responsavel.getId(), responsavel.getNmPessoa(), responsavel.getNrTelefone(), responsavel.getUsuario() != null
        );
    }
}
