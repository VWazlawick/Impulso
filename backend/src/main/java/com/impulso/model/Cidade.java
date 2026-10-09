package com.impulso.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cidade")
@Getter
@Setter
@NoArgsConstructor
public class Cidade {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nmCidade", nullable = false)
    private String nmCidade;

    @Column(nullable = false, unique = true)
    private Long cdIbge;

    @ManyToOne
    @JoinColumn(name = "estado_id", nullable = false)
    private Estado estado;

    public Cidade(String nmCidade, Long cdIbge, Estado estado) {
        this.nmCidade = nmCidade;
        this.cdIbge = cdIbge;
        this.estado = estado;
    }
}
