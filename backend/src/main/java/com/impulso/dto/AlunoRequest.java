package com.impulso.dto;

import com.impulso.enums.TipoServicoEnum;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record AlunoRequest(
        @NotBlank(message = "O nome do Aluno é obrigatório!") String nmPessoa,
        @Pattern(regexp = "\\d{11}", message = "O CPF deve ter 11 dígitos, sem pontuação") String cpf,
        @Email(message = "Email inválido") String email,
        @NotNull(message = "Data de Nascimento obrigatória!")
        @Past(message = "A Data de Nascimento deve estar no passado!") LocalDate dtNascimento,
        @NotNull(message = "O Tipo de Serviço é obrigatório!")TipoServicoEnum tpServico,
        Long profissionalId
        ) {
}
