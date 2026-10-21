package com.impulso.model;

import com.impulso.enums.SexoEnum;
import com.impulso.enums.TipoServicoEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "aluno")
@Getter
@Setter
@NoArgsConstructor
public class Aluno extends Pessoa{

    @Column(name = "dtNascimento", nullable = false)
    private LocalDate dtNascimento;

    @Column(name = "tpServico", nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoServicoEnum tpServico;

    @Column(name = "tpSexo", nullable = false)
    @Enumerated(EnumType.STRING)
    private SexoEnum sexo;

    @ManyToOne
    @JoinColumn(name = "profissional_id", nullable = false)
    private Profissional profissional;

    @ManyToMany
    @JoinTable(
            name = "aluno_responsavel",
            joinColumns  = @JoinColumn(name = "aluno_id"),
            inverseJoinColumns = @JoinColumn(name = "responsavel_id")
    )
    private Set<Responsavel> responsaveis = new HashSet<>();

    public Aluno(String nmPessoa, String cpf, String email, LocalDate dtNascimento, TipoServicoEnum tpServico, Profissional profissional, SexoEnum sexo) {
        super(nmPessoa, cpf, email);
        this.dtNascimento = dtNascimento;
        this.tpServico = tpServico;
        this.profissional = profissional;
        this.sexo = sexo;
    }
}
