package com.impulso.service;

import com.impulso.dto.ClassificacaoRequest;
import com.impulso.dto.ClassificacaoResponse;
import com.impulso.enums.TipoIndicadorEnum;
import com.impulso.exception.ConflitoException;
import com.impulso.exception.RecursoNaoEncontradoException;
import com.impulso.exception.RequisicaoInvalidaException;
import com.impulso.model.Classificacao;
import com.impulso.model.Subgrupo;
import com.impulso.repository.ClassificacaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ClassificacaoService {

    private final ClassificacaoRepository classificacaoRepository;
    private final SubgrupoService subgrupoService;

    public ClassificacaoService(ClassificacaoRepository classificacaoRepository, SubgrupoService subgrupoService) {
        this.classificacaoRepository = classificacaoRepository;
        this.subgrupoService = subgrupoService;
    }

    @Transactional(readOnly = true)
    public List<ClassificacaoResponse> listar(TipoIndicadorEnum tpIndicador, Long subgrupoId){
        Subgrupo subgrupo = (subgrupoId == null) ? null : subgrupoService.buscarEntidade(subgrupoId);

        return buscarFaixas(tpIndicador, subgrupo).stream().map(ClassificacaoResponse::de).toList();
    }

    @Transactional
    public ClassificacaoResponse cadastrar(ClassificacaoRequest request){
        Subgrupo subgrupo = validar(request, 0L);

        Classificacao classificacao = new Classificacao(request.tpIndicador(), subgrupo, request.tpSexo(),
                request.nrIdadeMin(), request.nrIdadeMax(), request.vlInicio(), request.dsClassificacao());

        return ClassificacaoResponse.de(classificacaoRepository.save(classificacao));
    }

    @Transactional
    public ClassificacaoResponse atualizar(Long id, ClassificacaoRequest request){
        Classificacao classificacao = buscarEntidade(id);
        Subgrupo subgrupo = validar(request, id);

        classificacao.setDsClassificacao(request.dsClassificacao());
        classificacao.setNrIdadeMin(request.nrIdadeMin());
        classificacao.setNrIdadeMax(request.nrIdadeMax());
        classificacao.setTpIndicador(request.tpIndicador());
        classificacao.setSubgrupo(subgrupo);
        classificacao.setTpSexo(request.tpSexo());
        classificacao.setVlInicio(request.vlInicio());

        return ClassificacaoResponse.de(classificacaoRepository.save(classificacao));
    }

    @Transactional
    public void excluir(Long id){
        classificacaoRepository.delete(buscarEntidade(id));
    }

    private List<Classificacao> buscarFaixas(TipoIndicadorEnum tpIndicador, Subgrupo subgrupo){
        return classificacaoRepository.findByTpIndicadorAndSubgrupoOrderByTpSexoAscNrIdadeMinAscVlInicioAsc(tpIndicador, subgrupo);
    }

    private Subgrupo validarIndicador(ClassificacaoRequest request){
        if(request.tpIndicador() != TipoIndicadorEnum.SUBGRUPO){
            if(request.subgrupoId() != null){
                throw new RequisicaoInvalidaException("IMC e RCE não usam subgrupo: deixe o subgrupoId vazio!");
            }
            return null;
        }
        if(request.subgrupoId() == null){
            throw  new RequisicaoInvalidaException("Informe o subgrupo da classificação!");
        }

        Subgrupo subgrupo = subgrupoService.buscarEntidade(request.subgrupoId());

        if (!subgrupo.getTpCalculo().resultadoNumerico()){
            throw new RequisicaoInvalidaException("Só subgrupos com cálculo MAIOR_VALOR ou MENOS_VALOR têm classificação!");
        }
        return subgrupo;
    }

    private Subgrupo validar(ClassificacaoRequest request, Long ignorarId){
        if(request.nrIdadeMin() > request.nrIdadeMax()){
            throw new RequisicaoInvalidaException("A idade mínima não pode ser maior que a máxima!");
        }

        Subgrupo subgrupo = validarIndicador(request);

        boolean repetida = buscarFaixas(request.tpIndicador(), subgrupo).stream().anyMatch(faixa ->
                !faixa.getId().equals(ignorarId)
                && faixa.getTpSexo() == request.tpSexo()
                && faixa.getNrIdadeMin() <= request.nrIdadeMax()
                && faixa.getNrIdadeMax() >= request.nrIdadeMin()
                && faixa.getVlInicio().compareTo(request.vlInicio()) == 0);

        if(repetida){
            throw new ConflitoException("Já existe uma faixa começando em " + request.vlInicio() + " para esse sexo e essas idades");
        }
        return subgrupo;
    }

    private Classificacao buscarEntidade(Long id){
        return classificacaoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Classificação não encontrada!"));
    }


}
