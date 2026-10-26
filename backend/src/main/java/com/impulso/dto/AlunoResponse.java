package com.impulso.dto;

import com.impulso.enums.SexoEnum;
import com.impulso.enums.TipoServicoEnum;
import com.impulso.model.Aluno;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AlunoResponse(Long id, String nmPessoa, String cpf, String email, LocalDate dtNascimento,
                            TipoServicoEnum tpServico, Long profissionalId, SexoEnum sexo, BigDecimal vlPeso, BigDecimal vlEstatura, BigDecimal vlCintura) {

    public static AlunoResponse de(Aluno aluno){
        return new AlunoResponse(
                aluno.getId(), aluno.getNmPessoa(), aluno.getCpf(), aluno.getEmail(), aluno.getDtNascimento(),
                aluno.getTpServico(), aluno.getProfissional().getId(), aluno.getSexo(), aluno.getVlPeso(),
                aluno.getVlEstatura(), aluno.getVlCintura()
                );
    }
}
