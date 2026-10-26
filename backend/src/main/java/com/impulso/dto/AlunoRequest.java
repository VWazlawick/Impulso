package com.impulso.dto;

import com.impulso.enums.SexoEnum;
import com.impulso.enums.TipoServicoEnum;
import com.impulso.utils.ConversorMedida;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AlunoRequest(
        @NotBlank(message = "O nome do Aluno é obrigatório!") String nmPessoa,
        @Pattern(regexp = "\\d{11}", message = "O CPF deve ter 11 dígitos, sem pontuação") String cpf,
        @Email(message = "Email inválido") String email,
        @NotNull(message = "Data de Nascimento obrigatória!")
        @Past(message = "A Data de Nascimento deve estar no passado!") LocalDate dtNascimento,
        @NotNull(message = "O Tipo de Serviço é obrigatório!")TipoServicoEnum tpServico,
        Long profissionalId,
        @NotNull(message = "O sexo do Aluno é obrigatório!")
        SexoEnum sexo,
        @DecimalMin(value = "0", inclusive = false, message = "O peso deve ser maior que zero!")
        @Digits(integer = 3, fraction = 2, message = "O peso aceita até 3 dígitos inteiros e 2 decimais!")
        BigDecimal vlPeso,
        @DecimalMin(value = "30", message = "Estatura inválida: informe em centímetros (135) ou em metros (1.35)!")
        @Digits(integer = 3, fraction = 2, message = "A estatura aceita até 3 dígitos inteiros e 2 decimais!")
        BigDecimal vlEstatura,
        @DecimalMin(value = "20", message = "Cintura inválida: informe em centímetros (60) ou em metros (0.60)!")
        @Digits(integer = 3, fraction = 2, message = "A cintura aceita até 3 dígitos inteiros e 2 decimais!")
        BigDecimal vlCintura
        ) {

        public AlunoRequest(String nmPessoa, String cpf, String email, LocalDate dtNascimento, TipoServicoEnum tpServico, Long profissionalId, SexoEnum sexo, BigDecimal vlPeso, BigDecimal vlEstatura, BigDecimal vlCintura) {
                this.nmPessoa = nmPessoa;
                this.cpf = cpf;
                this.email = email;
                this.dtNascimento = dtNascimento;
                this.tpServico = tpServico;
                this.profissionalId = profissionalId;
                this.sexo = sexo;
                this.vlPeso = vlPeso;
                this.vlEstatura = ConversorMedida.paraCentimetros(vlEstatura);
                this.vlCintura = ConversorMedida.paraCentimetros(vlCintura);
        }
}
