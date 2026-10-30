package com.impulso.dto;

import com.impulso.model.Responsavel;
import com.impulso.model.Usuario;

public record ResponsavelResponse(Long id, String nmPessoa, String nrTelefone, boolean possuiAcesso, Long usuarioId) {
    public static ResponsavelResponse de(Responsavel responsavel){
        Usuario usuario = responsavel.getUsuario();
        return new ResponsavelResponse(
                responsavel.getId(), responsavel.getNmPessoa(), responsavel.getNrTelefone(),
                usuario != null, usuario == null ? null : usuario.getId()
        );
    }
}
