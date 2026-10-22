package com.impulso.model;

import com.impulso.enums.TipoOpcaoEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "resposta")
@Getter
@Setter
@NoArgsConstructor
public class Resposta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(precision = 8, scale = 2)
    private BigDecimal vlResposta;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private TipoOpcaoEnum tpOpcao;

    @ManyToOne
    @JoinColumn(name = "avaliacao_id", nullable = false)
    private Avaliacao avaliacao;

    @ManyToOne
    @JoinColumn(name = "pergunta_id", nullable = false)
    private Pergunta pergunta;

    public Resposta(BigDecimal vlResposta, TipoOpcaoEnum tpOpcao, Avaliacao avaliacao, Pergunta pergunta) {
        this.vlResposta = vlResposta;
        this.tpOpcao = tpOpcao;
        this.avaliacao = avaliacao;
        this.pergunta = pergunta;
    }
}
