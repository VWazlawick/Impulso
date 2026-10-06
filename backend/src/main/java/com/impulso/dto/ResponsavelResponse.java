package com.impulso.dto;

import com.impulso.model.Responsavel;

public record ResponsavelResponse(Long id, String nmPessoa, String cpf, String email, boolean possuiAcesso) {
    public static ResponsavelResponse de(Responsavel responsavel){
        return new ResponsavelResponse(
                responsavel.getId(), responsavel.getNmPessoa(), responsavel.getCpf(), responsavel.getEmail(),
                responsavel.getUsuario() != null
        );
    }
}
