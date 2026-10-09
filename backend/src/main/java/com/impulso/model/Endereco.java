package com.impulso.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "endereco")
@Getter
@Setter
@NoArgsConstructor
public class Endereco {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rua", nullable = false)
    private String rua;

    @Column(name = "nrCasa", nullable = false)
    private String nrCasa;

    @Column(name = "bairro", nullable = false)
    private String bairro;

    @Column(name = "cep", nullable = false, length = 8)
    private String cep;

    @Column(name = "complemento", nullable = true)
    private String complemento;

    @ManyToOne
    @JoinColumn(name = "cidade_id", nullable = false)
    private Cidade cidade;

    @ManyToOne
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    public Endereco(String rua, String nrCasa, String bairro, String cep, String complemento, Cidade cidade, Aluno aluno) {
        this.rua = rua;
        this.nrCasa = nrCasa;
        this.bairro = bairro;
        this.cep = cep;
        this.complemento = complemento;
        this.cidade = cidade;
        this.aluno = aluno;
    }
}
