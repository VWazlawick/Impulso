package com.impulso.service;

import com.impulso.dto.PerguntaRequest;
import com.impulso.dto.PerguntaResponse;
import com.impulso.enums.TipoRespostaEnum;
import com.impulso.exception.ConflitoException;
import com.impulso.exception.RecursoNaoEncontradoException;
import com.impulso.exception.RequisicaoInvalidaException;
import com.impulso.model.Pergunta;
import com.impulso.model.Subgrupo;
import com.impulso.repository.PerguntaRepository;
import com.impulso.repository.ResponsavelRepository;
import com.impulso.repository.RespostaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PerguntaService {

    private final PerguntaRepository perguntaRepository;
    private final SubgrupoService subgrupoService;
    private final RespostaRepository respostaRepository;

    public PerguntaService(PerguntaRepository perguntaRepository, SubgrupoService subgrupoService, RespostaRepository respostaRepository) {
        this.perguntaRepository = perguntaRepository;
        this.subgrupoService = subgrupoService;
        this.respostaRepository = respostaRepository;
    }

    @Transactional
    public PerguntaResponse cadastrar(Long subgrupoId, PerguntaRequest request){
        Subgrupo subgrupo = subgrupoService.buscarEntidade(subgrupoId);
        validarTipo(subgrupo, request.tpResposta());

        Pergunta pergunta = new Pergunta(request.dsPergunta(), request.tpResposta(), request.dsUnidade(),
                request.nrOrdem(), subgrupo);

        return PerguntaResponse.de(perguntaRepository.save(pergunta));
    }

    @Transactional
    public PerguntaResponse atualizar(Long id, PerguntaRequest request){
        Pergunta pergunta = buscarEntidade(id);

        if(request.tpResposta() != pergunta.getTpResposta() && respostaRepository.existsByPerguntaId(id)){
            throw new ConflitoException("A pergunta já tem respostas registradas: o tipo não pode ser trocado!");
        }

        validarTipo(pergunta.getSubgrupo(), request.tpResposta());
        pergunta.setDsPergunta(request.dsPergunta());
        pergunta.setTpResposta(request.tpResposta());
        pergunta.setDsUnidade(request.dsUnidade());
        pergunta.setNrOrdem(request.nrOrdem());
        return PerguntaResponse.de(pergunta);
    }

    @Transactional
    public void excluir(Long id){
        Pergunta pergunta = buscarEntidade(id);
        if(respostaRepository.existsByPerguntaId(id)){
            throw new ConflitoException("A pergunta já tem respostas registradas e não pode ser excluída!");
        }

        perguntaRepository.delete(buscarEntidade(id));
    }


    private Pergunta buscarEntidade(Long id){
        return perguntaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pergunta não encontrada!"));
    }

    private void validarTipo(Subgrupo subgrupo, TipoRespostaEnum tpResposta){
        if(!subgrupo.getTpCalculo().aceita(tpResposta)){
            throw new RequisicaoInvalidaException("O subgrupo com cálculo " + subgrupo.getTpCalculo() +
                    " não aceita pergunta do tipo " + tpResposta + "!");
        }
    }
}
