package com.impulso.model;

import com.impulso.enums.SexoEnum;
import com.impulso.enums.TipoIndicadorEnum;
import com.impulso.enums.TipoServicoEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "classificacao")
@Setter
@Getter
@NoArgsConstructor
public class Classificacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoIndicadorEnum tpIndicador;

    @ManyToOne
    @JoinColumn(name = "subgrupo_id")
    private Subgrupo subgrupo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private SexoEnum tpSexo;

    @Column(nullable = false)
    private Integer nrIdadeMin;

    @Column(nullable = false)
    private Integer nrIdadeMax;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal vlInicio;

    @Column(nullable = false, length = 30)
    private String dsClassificacao;

    public Classificacao(TipoIndicadorEnum tpIndicador, Subgrupo subgrupo, SexoEnum tpSexo, Integer nrIdadeMin, Integer nrIdadeMax, BigDecimal vlInicio, String dsClassificacao) {
        this.tpIndicador = tpIndicador;
        this.subgrupo = subgrupo;
        this.tpSexo = tpSexo;
        this.nrIdadeMin = nrIdadeMin;
        this.nrIdadeMax = nrIdadeMax;
        this.vlInicio = vlInicio;
        this.dsClassificacao = dsClassificacao;
    }
}
