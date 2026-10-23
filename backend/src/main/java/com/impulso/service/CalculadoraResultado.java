package com.impulso.service;

import com.impulso.enums.EstagioEnum;
import com.impulso.enums.TipoOpcaoEnum;
import com.impulso.model.Avaliacao;
import com.impulso.model.AvaliacaoResumo;
import com.impulso.model.Resposta;
import com.impulso.model.Subgrupo;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class CalculadoraResultado {

    public List<AvaliacaoResumo> calcular(Avaliacao avaliacao){
        Map<Subgrupo, List<Resposta>> respostasPorSubgrupo = avaliacao.getRespostas().stream().collect(Collectors
                .groupingBy(resposta -> resposta.getPergunta().getSubgrupo()));

        List<AvaliacaoResumo> resumos = new ArrayList<>();
        respostasPorSubgrupo.forEach((subgrupo, respostas) -> {
            switch (subgrupo.getTpCalculo()){
                case MAIOR_VALOR -> resumos.add(new AvaliacaoResumo(maiorValor(respostas), null, avaliacao, subgrupo));
                case MENOR_VALOR -> resumos.add(new AvaliacaoResumo(menorValor(respostas), null, avaliacao, subgrupo));
                case ESTAGIO -> resumos.add(new AvaliacaoResumo(null, estagio(respostas), avaliacao, subgrupo));
                case NENHUM -> {}
            }
        });
        return resumos;
    }

    private BigDecimal maiorValor(List<Resposta> respostas){
        return respostas.stream().map(Resposta::getVlResposta).max(Comparator.naturalOrder()).orElse(null);
    }

    private BigDecimal menorValor(List<Resposta> respostas){
        return respostas.stream().map(Resposta::getVlResposta).min(Comparator.naturalOrder()).orElse(null);
    }

    private EstagioEnum estagio(List<Resposta> respostas){
        long nao = respostas.stream().filter(resposta -> resposta.getTpOpcao() == TipoOpcaoEnum.NAO).count();

        long parcial = respostas.stream().filter(resposta -> resposta.getTpOpcao() == TipoOpcaoEnum.PARCIAL).count();

        if(nao>=2){
            return EstagioEnum.INICIAL;
        }
        if(nao==0 && parcial <=1){
            return EstagioEnum.MADURO;
        }
        return  EstagioEnum.ELEMENTAR;
    }
}
