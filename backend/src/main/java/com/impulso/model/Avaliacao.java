package com.impulso.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "avaliacao")
@Getter
@Setter
@NoArgsConstructor
public class Avaliacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate dtAvaliacao;

    @ManyToOne
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @ManyToOne
    @JoinColumn(name = "profissional_id", nullable = false)
    private  Profissional profissional;

    @ManyToOne
    @JoinColumn(name = "grupo_id", nullable = false)
    private Grupo grupo;

    @Column(precision = 5, scale = 2)
    private BigDecimal vlPeso;

    @Column(precision = 5, scale = 2)
    private BigDecimal vlEstatura;

    @Column(precision = 5, scale = 2)
    private BigDecimal vlCintura;

    // Onde foi a avaliação e quanto tempo durou, em minutos (opcionais, como no cabeçalho das fichas)
    @Column(length = 100)
    private String dsLocal;

    private Integer nrDuracao;

    @OneToMany(mappedBy = "avaliacao", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Resposta> respostas = new ArrayList<>();

    @OneToMany(mappedBy = "avaliacao", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AvaliacaoResumo> resumos =  new ArrayList<>();


    public Avaliacao(LocalDate dtAvaliacao, Aluno aluno, Profissional profissional, Grupo grupo) {
        this.dtAvaliacao = dtAvaliacao;
        this.aluno = aluno;
        this.profissional = profissional;
        this.grupo = grupo;
    }

    public BigDecimal calcularImc(){
        if(vlPeso == null || vlEstatura == null){
            return null;
        }
        BigDecimal metros = vlEstatura.divide(new BigDecimal("100"));
        return vlPeso.divide(metros.multiply(metros), 2, RoundingMode.HALF_UP);
    }

    public BigDecimal calcularRce(){
        if(vlCintura == null || vlEstatura == null){
            return null;
        }
        return vlCintura.divide(vlEstatura, 2, RoundingMode.HALF_UP);
    }

    public int calcularIdade(){
        return Period.between(aluno.getDtNascimento(), dtAvaliacao).getYears();
    }
}
