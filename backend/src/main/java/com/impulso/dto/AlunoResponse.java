package com.impulso.dto;

import com.impulso.enums.TipoServicoEnum;
import com.impulso.model.Aluno;

import java.time.LocalDate;

public record AlunoResponse(Long id, String nmPessoa, String cpf, String email, LocalDate dtNascimento,
                            TipoServicoEnum tpServico, Long profissionalId) {

    public static AlunoResponse de(Aluno aluno){
        return new AlunoResponse(
                aluno.getId(), aluno.getNmPessoa(), aluno.getCpf(), aluno.getEmail(), aluno.getDtNascimento(),
                aluno.getTpServico(), aluno.getProfissional().getId()
                );
    }
}
