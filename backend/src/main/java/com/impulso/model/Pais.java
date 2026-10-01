package com.impulso.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pais")
@Getter
@Setter
@NoArgsConstructor
public class Pais {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nmPais", nullable = false)
    private String nmPais;

    @Column(name = "sgPais", nullable = false, unique = true, length = 2)
    private String sgPais;

    public Pais(String nmPais, String sgPais) {
        this.nmPais = nmPais;
        this.sgPais = sgPais;
    }
}
