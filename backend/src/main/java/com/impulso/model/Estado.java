package com.impulso.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "estado")
@Getter
@Setter
@NoArgsConstructor
public class Estado {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nmEstado", nullable = false)
    private String nmEstado;

    @Column(name = "sgEstado", nullable = false, unique = true, length = 2)
    private String sgEstado;

    @ManyToOne
    @JoinColumn(name = "pais_id", nullable = false)
    private Pais pais;

    public Estado(String nmEstado, String sgEstado, Pais pais) {
        this.nmEstado = nmEstado;
        this.sgEstado = sgEstado;
        this.pais = pais;
    }
}
