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

    public Responsavel(String nmPessoa, String cpf, String email){
        super(nmPessoa, cpf, email);
    }
}
