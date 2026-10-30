package com.impulso.service;

import com.impulso.dto.EvolucaoAvaliacaoResponse;
import com.impulso.dto.EvolucaoIndicadorResponse;
import com.impulso.dto.EvolucaoPontoResponse;
import com.impulso.dto.EvolucaoResponse;
import com.impulso.model.Aluno;
import com.impulso.model.Avaliacao;
import com.impulso.model.AvaliacaoResumo;
import com.impulso.model.Subgrupo;
import com.impulso.repository.AvaliacaoRepository;
import com.impulso.security.Solicitante;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class EvolucaoService {

    private final AlunoService alunoService;
    private final AvaliacaoRepository avaliacaoRepository;
    private final ClassificacaoService classificacaoService;

    public EvolucaoService(AlunoService alunoService, AvaliacaoRepository avaliacaoRepository, ClassificacaoService classificacaoService) {
        this.alunoService = alunoService;
        this.avaliacaoRepository = avaliacaoRepository;
        this.classificacaoService = classificacaoService;
    }

    @Transactional(readOnly = true)
    public EvolucaoResponse evolucao(Long alunoId, Solicitante solicitante){
        Aluno aluno = alunoService.buscarAlunoPermitido(alunoId, solicitante);

        List<Avaliacao> avaliacoes = avaliacaoRepository.findByAlunoIdOrderByDtAvaliacaoAscIdAsc(alunoId);

        Map<String, EvolucaoIndicadorResponse> indicadores = new LinkedHashMap<>();
        for(Avaliacao avaliacao : avaliacoes){
            List<AvaliacaoResumo> resumos = avaliacao.getResumos().stream().sorted(Comparator.comparing(resumo ->
                    resumo.getSubgrupo().getNrOrdem())).toList();

            for(AvaliacaoResumo resumo : resumos){
                Subgrupo subgrupo = resumo.getSubgrupo();
                String chave = subgrupo.getNmSubgrupo().trim().toLowerCase() + "|" + subgrupo.getTpCalculo();

                EvolucaoIndicadorResponse indicador = indicadores.computeIfAbsent(chave, k ->
                        new EvolucaoIndicadorResponse(subgrupo.getNmSubgrupo(), subgrupo.getTpCalculo(),
                                new ArrayList<>(), subgrupo.unidadeDoResultado()));

                indicador.pontos().add(EvolucaoPontoResponse.de(resumo, classificacaoService.classificarResultado(resumo)));
            }
        }

        return new EvolucaoResponse(aluno.getId(), aluno.getNmPessoa(),
                avaliacoes.stream().map(avaliacao -> EvolucaoAvaliacaoResponse.de(avaliacao,
                        classificacaoService.montarMedidas(avaliacao))).toList(),
                new ArrayList<>(indicadores.values()));
    }
}
