package com.impulso.service;

import com.impulso.dto.SubgrupoRequest;
import com.impulso.dto.SubgrupoResponse;
import com.impulso.exception.ConflitoException;
import com.impulso.exception.RecursoNaoEncontradoException;
import com.impulso.exception.RequisicaoInvalidaException;
import com.impulso.model.Grupo;
import com.impulso.model.Pergunta;
import com.impulso.model.Subgrupo;
import com.impulso.repository.ClassificacaoRepository;
import com.impulso.repository.RespostaRepository;
import com.impulso.repository.SubgrupoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubgrupoService {

    private final SubgrupoRepository subgrupoRepository;
    private  final GrupoService grupoService;
    private final RespostaRepository respostaRepository;
    private final ClassificacaoRepository classificacaoRepository;

    public SubgrupoService(SubgrupoRepository subgrupoRepository, GrupoService grupoService, RespostaRepository respostaRepository, ClassificacaoRepository classificacaoRepository) {
        this.subgrupoRepository = subgrupoRepository;
        this.grupoService = grupoService;
        this.respostaRepository = respostaRepository;
        this.classificacaoRepository = classificacaoRepository;
    }

    @Transactional
    public SubgrupoResponse cadastrar(Long grupoId, SubgrupoRequest request){
        Grupo grupo = grupoService.buscarEntidade(grupoId);
        Subgrupo subgrupo = new Subgrupo(request.nmSubgrupo(), request.tpCalculo(), request.nrOrdem(), grupo);
        return SubgrupoResponse.de(subgrupoRepository.save(subgrupo));
    }

    @Transactional
    public SubgrupoResponse atualizar(Long id, SubgrupoRequest request){
        Subgrupo subgrupo = buscarEntidade(id);

        if(request.tpCalculo() != subgrupo.getTpCalculo() && respostaRepository.existsByPerguntaSubgrupoId(id)){
            throw new ConflitoException("O subgrupo já tem respostas registradas: o tipo de cálculo não pode ser trocado!");
        }

        for(Pergunta pergunta : subgrupo.getPerguntas()){
            if (!request.tpCalculo().aceita(pergunta.getTpResposta())){
                throw new RequisicaoInvalidaException("O cálculo " + request.tpCalculo() +
                        " não aceita as perguntas do tipo " + pergunta.getTpResposta() + " já cadastradas!");
            }
        }

        subgrupo.setNmSubgrupo(request.nmSubgrupo());
        subgrupo.setTpCalculo(request.tpCalculo());
        subgrupo.setNrOrdem(request.nrOrdem());

        return SubgrupoResponse.de(subgrupo);
    }

    @Transactional
    public void excluir(Long id){
        Subgrupo subgrupo = buscarEntidade(id);
        if(!subgrupo.getPerguntas().isEmpty()){
            throw new ConflitoException("Exclua as perguntas antes de excluir o subgrupo!");
        }

        if(classificacaoRepository.existsBySubgrupoId(id)){
            throw new ConflitoException("Exclua as classificações antes de excluir o subgrupo!");
        }
        subgrupoRepository.delete(subgrupo);
    }


    public Subgrupo buscarEntidade(Long id){
        return subgrupoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Subgrupo não encontrado!"));
    }
}
