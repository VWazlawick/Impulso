package com.impulso.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name =  "responsavel")
@Getter
@Setter
@NoArgsConstructor
public class Responsavel extends Pessoa{

    @OneToOne
    @JoinColumn(name = "usuario_id", unique = true)
    private Usuario usuario;

    @Column(nullable = false, length = 11)
    private String nrTelefone;

    public Responsavel(String nmPessoa, String nrTelefone) {
        super(nmPessoa, null, null);
        this.nrTelefone = nrTelefone;
    }
}
