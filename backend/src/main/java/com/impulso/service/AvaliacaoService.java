package com.impulso.service;

import com.impulso.dto.*;
import com.impulso.enums.TipoRespostaEnum;
import com.impulso.exception.ConflitoException;
import com.impulso.exception.RecursoNaoEncontradoException;
import com.impulso.exception.RequisicaoInvalidaException;
import com.impulso.model.*;
import com.impulso.repository.AlunoRepository;
import com.impulso.repository.AvaliacaoRepository;
import com.impulso.repository.GrupoRepository;
import com.impulso.security.Solicitante;
import org.springframework.cglib.core.Local;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.*;

@Service
public class AvaliacaoService {

    private final AlunoService alunoService;
    private final GrupoRepository grupoRepository;
    private final AvaliacaoRepository avaliacaoRepository;
    private final CalculadoraResultado calculadoraResultado;
    private final AlunoRepository alunoRepository;
    private final ClassificacaoService classificacaoService;

    public AvaliacaoService(AlunoService alunoService, GrupoRepository grupoRepository, AvaliacaoRepository avaliacaoRepository, CalculadoraResultado calculadoraResultado, AlunoRepository alunoRepository, ClassificacaoService classificacaoService) {
        this.alunoService = alunoService;
        this.grupoRepository = grupoRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.calculadoraResultado = calculadoraResultado;
        this.alunoRepository = alunoRepository;
        this.classificacaoService = classificacaoService;
    }

    @Transactional(readOnly = true)
    public FichaResponse ficha(Long alunoId, LocalDate dtAvaliacao, Solicitante solicitante){
        Aluno aluno = alunoService.buscarAlunoPermitido(alunoId, solicitante);
        validarAtivo(aluno);
        LocalDate data = (dtAvaliacao == null) ? LocalDate.now() : dtAvaliacao;
        int idade = calcularIdade(aluno, data);
        return FichaResponse.de(aluno, data, idade, buscarGrupoPorIdade(idade));
    }

    @Transactional
    public AvaliacaoResponse registrar(Long alunoId, AvaliacaoRequest request, Solicitante solicitante){
        Aluno aluno = alunoService.buscarAlunoPermitido(alunoId, solicitante);
        validarAtivo(aluno);
        int idade = calcularIdade(aluno, request.dtAvaliacao());
        Grupo grupo = buscarGrupoPorIdade(idade);

        Avaliacao avaliacao = new Avaliacao(request.dtAvaliacao(), aluno, aluno.getProfissional(), grupo);
        preencherMedidas(avaliacao, request);
        preencherSessao(avaliacao, request);
        preencherResposta(avaliacao, request.respostas());
        avaliacaoRepository.save(avaliacao);
        atualizarMedidas(avaliacao);

        return montarResposta(avaliacao);
    }

    @Transactional(readOnly = true)
    public List<AvaliacaoListaResponse> listar(Long alunoId, Solicitante solicitante){
        Aluno aluno = alunoService.buscarAlunoPermitido(alunoId, solicitante);

        return avaliacaoRepository.findByAlunoIdOrderByDtAvaliacaoDesc(aluno.getId()).stream().map(AvaliacaoListaResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public AvaliacaoResponse buscarPorId(Long alunoId, Long id, Solicitante solicitante){
        return montarResposta(buscarAvaliacaoPermitida(alunoId, id, solicitante));
    }

    @Transactional
    public AvaliacaoResponse atualizar(Long alunoId, Long id, AvaliacaoRequest request
            ,Solicitante solicitante){

        Avaliacao avaliacao = buscarAvaliacaoPermitida(alunoId, id, solicitante);
        int idade = calcularIdade(avaliacao.getAluno(), request.dtAvaliacao());
        Grupo grupo = avaliacao.getGrupo();

        if(idade<grupo.getNrIdadeMin() || idade > grupo.getNrIdadeMax()){
            throw new RequisicaoInvalidaException("Na nova data o novo aluno teria " + idade + " anos e sairia" +
                    " da faixa do " + grupo.getNmGrupo() + "!");
        }

        avaliacao.setDtAvaliacao(request.dtAvaliacao());
        preencherMedidas(avaliacao,request);
        preencherSessao(avaliacao, request);

        avaliacao.getResumos().clear();
        avaliacao.getRespostas().clear();
        avaliacaoRepository.flush();
        preencherResposta(avaliacao, request.respostas());
        atualizarMedidas(avaliacao);

        return montarResposta(avaliacao);
    }

    @Transactional
    public void excluir(Long alunoId, Long id, Solicitante solicitante){
        avaliacaoRepository.delete(buscarAvaliacaoPermitida(alunoId, id, solicitante));
    }

    private int calcularIdade(Aluno aluno, LocalDate data){
        if(data.isAfter(LocalDate.now())){
            throw new RequisicaoInvalidaException("A data de avaliação não pode ser futura!");
        }
        if(data.isBefore(aluno.getDtNascimento())){
            throw new RequisicaoInvalidaException("A data de avaliação é anterior ao nascimento do aluno!");
        }
        return Period.between(aluno.getDtNascimento(),data).getYears();
    }

    private Grupo buscarGrupoPorIdade(int idade){
        return grupoRepository.buscarPorIdade(idade)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Nenhum grupo atende a idade de " + idade + " anos!"));
    }

    private void preencherResposta(Avaliacao avaliacao, List<RespostaRequest> respostas){
        Map<Long, Pergunta> perguntasDoGrupo  = new HashMap<>();

        for (Subgrupo subgrupo : avaliacao.getGrupo().getSubgrupos()){
            for (Pergunta pergunta : subgrupo.getPerguntas()){
                perguntasDoGrupo.put(pergunta.getId(), pergunta);
            }
        }

        Set<Long> respondidas = new HashSet<>();

        for (RespostaRequest resposta : respostas){
            Pergunta pergunta = perguntasDoGrupo.get(resposta.perguntaId());
            if(pergunta == null){
                throw new RequisicaoInvalidaException("A pergunta " + resposta.perguntaId() + " não pertence" +
                        "ao grupo desta avaliação!");
            }
            if(!respondidas.add(resposta.perguntaId())){
                throw new RequisicaoInvalidaException("A pergunta " + resposta.perguntaId() + " foi respondida" +
                        " mais de uma vez!");
            }

            validarFormato(pergunta, resposta);

            avaliacao.getRespostas().add(new Resposta(resposta.vlResposta(), resposta.tpOpcao(), avaliacao, pergunta));
        }
        avaliacao.getResumos().addAll(calculadoraResultado.calcular(avaliacao));
    }

    private void validarFormato(Pergunta pergunta, RespostaRequest resposta){
        if(pergunta.getTpResposta() == TipoRespostaEnum.NUMERO){
            if(resposta.vlResposta() == null || resposta.tpOpcao() != null){
                throw new RequisicaoInvalidaException("A pergunta " + pergunta.getId() + " espera um número em vlResposta!");
            }
        }
        else if(resposta.tpOpcao() == null || resposta.vlResposta() != null){
            throw new RequisicaoInvalidaException("A pergunta " + pergunta.getId() + " espera SIM, NAO ou PARCIAL em tpOpcao!");
        }
    }

    private Avaliacao buscarAvaliacaoPermitida(Long alunoId, Long id, Solicitante solicitante){
        alunoService.buscarAlunoPermitido(alunoId, solicitante);
        return avaliacaoRepository.findByIdAndAlunoId(id, alunoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Avaliação não encontrada!"));
    }

    // Local e duração da sessão: opcionais, valem só para esta avaliação (não vão para o cadastro do aluno).
    private void preencherSessao(Avaliacao avaliacao, AvaliacaoRequest request){
        avaliacao.setDsLocal(request.dsLocal());
        avaliacao.setNrDuracao(request.nrDuracao());
    }

    private void preencherMedidas(Avaliacao avaliacao, AvaliacaoRequest request){
        avaliacao.setVlPeso(request.vlPeso());
        avaliacao.setVlEstatura(request.vlEstatura());
        avaliacao.setVlCintura(request.vlCintura());
    }

    private void atualizarMedidas(Avaliacao avaliacao){
        Aluno aluno = avaliacao.getAluno();

        if(avaliacaoRepository.existsByAlunoIdAndDtAvaliacaoAfter(aluno.getId(), avaliacao.getDtAvaliacao())){
            return;
        }
        if(avaliacao.getVlPeso() != null){
            aluno.setVlPeso(avaliacao.getVlPeso());
        }
        if(avaliacao.getVlEstatura() != null){
            aluno.setVlEstatura(avaliacao.getVlEstatura());
        }
        if(avaliacao.getVlCintura() != null){
            aluno.setVlCintura(avaliacao.getVlCintura());
        }
    }

    private AvaliacaoResponse montarResposta(Avaliacao avaliacao){
        List<ResultadoResponse> resultados = avaliacao.getResumos().stream()
                .sorted(Comparator.comparing(resumo -> resumo.getSubgrupo().getNrOrdem()))
                .map(resumo -> ResultadoResponse.de(resumo, classificacaoService.classificarResultado(resumo)))
                .toList();

        return AvaliacaoResponse.de(avaliacao, classificacaoService.montarMedidas(avaliacao), resultados);
    }

    private void validarAtivo(Aluno aluno){
        if(!aluno.isStAtivo()){
            throw new ConflitoException("O aluno está inativo: reative o cadastro para gerar avaliações!");
        }
    }
}
