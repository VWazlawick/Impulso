package com.impulso.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pessoa")
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@Setter
@NoArgsConstructor
public abstract class Pessoa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nmPessoa;

    @Column(unique = true, length = 11)
    private String cpf;

    @Column(length = 150)
    private String email;

    protected Pessoa(String nmPessoa, String cpf, String email) {
        this.nmPessoa = nmPessoa;
        this.cpf = cpf;
        this.email = email;
    }
}
