package com.impulso.dto;

import com.impulso.enums.TipoUsuarioEnum;
import com.impulso.model.Usuario;

public record UsuarioResponse(Long id, String email, TipoUsuarioEnum tpUsuario, boolean stAtivo) {
    public static UsuarioResponse de(Usuario usuario){
        return new UsuarioResponse(
            usuario.getId(), usuario.getEmail(), usuario.getTpUsuario(), usuario.isStAtivo()
        );
    }
}
