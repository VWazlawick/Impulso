package com.impulso.model;

import com.impulso.enums.TipoCalculoEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "subgrupo")
@Setter
@Getter
@NoArgsConstructor
public class Subgrupo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nmSubgrupo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoCalculoEnum tpCalculo;

    @Column(nullable = false)
    private Integer nrOrdem;

    @ManyToOne
    @JoinColumn(name = "grupo_id", nullable = false)
    private Grupo grupo;

    @OneToMany(mappedBy = "subgrupo")
    @OrderBy("nrOrdem")
    private List<Pergunta> perguntas = new ArrayList<>();

    public Subgrupo(String nmSubgrupo, TipoCalculoEnum tpCalculo, Integer nrOrdem, Grupo grupo) {
        this.nmSubgrupo = nmSubgrupo;
        this.tpCalculo = tpCalculo;
        this.nrOrdem = nrOrdem;
        this.grupo = grupo;
    }
}
