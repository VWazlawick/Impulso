package com.impulso.model;

import com.impulso.enums.TipoRespostaEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pergunta")
@Getter
@Setter
@NoArgsConstructor
public class Pergunta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String dsPergunta;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoRespostaEnum tpResposta;

    @Column(length = 20)
    private String dsUnidade;

    @Column(nullable = false)
    private Integer nrOrdem;

    @ManyToOne
    @JoinColumn(name = "subgrupo_id", nullable = false)
    private Subgrupo subgrupo;

    public Pergunta(String dsPergunta, TipoRespostaEnum tpResposta, String dsUnidade, Integer nrOrdem, Subgrupo subgrupo) {
        this.dsPergunta = dsPergunta;
        this.tpResposta = tpResposta;
        this.dsUnidade = dsUnidade;
        this.nrOrdem = nrOrdem;
        this.subgrupo = subgrupo;
    }
}
