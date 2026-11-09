package com.impulso.dto;

import com.impulso.enums.TipoUsuarioEnum;

public record UsuarioListaResponse(Long id, String email, TipoUsuarioEnum tpUsuario, boolean stAtivo, String nmPessoa) {
}
