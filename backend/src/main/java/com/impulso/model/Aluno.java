package com.impulso.model;

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
public class Aluno {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nmAluno", nullable = false)
    private String nmAluno;

    @Column(name = "cpf", nullable = true, unique = true, length = 11)
    private String cpf;

    @Column(name = "email", nullable = true)
    private String email;

    @Column(name = "dtNascimento", nullable = false)
    private LocalDate dtNascimento;

    @Column(name = "tpServico", nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoServicoEnum tpServico;

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

    public Aluno(String nmAluno, String cpf, String email, LocalDate dtNascimento, TipoServicoEnum tpServico, Profissional profissional) {
        this.nmAluno = nmAluno;
        this.cpf = cpf;
        this.email = email;
        this.dtNascimento = dtNascimento;
        this.tpServico = tpServico;
        this.profissional = profissional;
    }
}
