package com.impulso.dto;

import com.impulso.model.Profissional;
import com.impulso.model.Usuario;

public record ProfissionalResponse(Long id, String nmPessoa, String cpf, String email, boolean possuiAcesso, Long usuarioId) {

    public static ProfissionalResponse de(Profissional profissional){
        Usuario usuario = profissional.getUsuario();
        return new ProfissionalResponse(
                profissional.getId(), profissional.getNmPessoa(), profissional.getCpf(),
                profissional.getEmail(), usuario!=null, usuario == null ? null : usuario.getId());
    }
}
