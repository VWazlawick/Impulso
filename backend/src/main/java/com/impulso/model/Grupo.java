package com.impulso.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "grupo")
@Getter
@Setter
@NoArgsConstructor
public class Grupo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String nmGrupo;

    @Column(nullable = false)
    private Integer nrIdadeMin;

    @Column(nullable = false)
    private  Integer nrIdadeMax;

    @OneToMany(mappedBy = "grupo")
    @OrderBy("nrOrdem")
    private List<Subgrupo> subgrupos = new ArrayList<>();

    public Grupo(String nmGrupo, Integer nrIdadeMin, Integer nrIdadeMax) {
        this.nmGrupo = nmGrupo;
        this.nrIdadeMin = nrIdadeMin;
        this.nrIdadeMax = nrIdadeMax;
    }
}
