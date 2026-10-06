package com.impulso.dto;

import com.impulso.model.Profissional;

public record ProfissionalResponse(Long id, String nmPessoa, String cpf, String email, boolean possuiAcesso) {

    public static ProfissionalResponse de(Profissional profissional){
        return new ProfissionalResponse(
                profissional.getId(), profissional.getNmPessoa(), profissional.getCpf(),
                profissional.getEmail(), profissional.getUsuario() != null);
    }
}
