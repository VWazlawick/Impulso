package com.impulso.security;

import org.springframework.security.oauth2.jwt.Jwt;

public final class UsuarioLogado {

    public UsuarioLogado() {
    }

    public static Long id(Jwt jwt){
        return ((Number) jwt.getClaim("usuarioId")).longValue();
    }

    public static boolean isAdmin(Jwt jwt){
        return jwt.getClaimAsStringList("roles").contains("ADMIN");
    }

    public static Solicitante solicitante(Jwt jwt){
        return new Solicitante(id(jwt), isAdmin(jwt));
    }
}
