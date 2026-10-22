package com.impulso.model;

import com.impulso.enums.EstagioEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "avaliacao_resumo")
@Getter
@Setter
@NoArgsConstructor
public class AvaliacaoResumo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(precision = 8, scale = 2)
    private BigDecimal vlResultado;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private EstagioEnum tpEstagio;

    @ManyToOne
    @JoinColumn(name = "avaliacao_id", nullable = false)
    private Avaliacao avaliacao;

    @ManyToOne
    @JoinColumn(name = "subgrupo_id", nullable = false)
    private  Subgrupo subgrupo;

    public AvaliacaoResumo(BigDecimal vlResultado, EstagioEnum tpEstagio, Avaliacao avaliacao, Subgrupo subgrupo) {
        this.vlResultado = vlResultado;
        this.tpEstagio = tpEstagio;
        this.avaliacao = avaliacao;
        this.subgrupo = subgrupo;
    }
}
