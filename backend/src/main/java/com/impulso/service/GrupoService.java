package com.impulso.service;

import com.impulso.dto.GrupoDetalheResponse;
import com.impulso.dto.GrupoRequest;
import com.impulso.dto.GrupoResponse;
import com.impulso.exception.ConflitoException;
import com.impulso.exception.RecursoNaoEncontradoException;
import com.impulso.exception.RequisicaoInvalidaException;
import com.impulso.model.Grupo;
import com.impulso.repository.GrupoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GrupoService {

    private final GrupoRepository grupoRepository;

    public GrupoService(GrupoRepository grupoRepository) {
        this.grupoRepository = grupoRepository;
    }

    @Transactional(readOnly = true)
    public List<GrupoResponse> listar(){
        return grupoRepository.findAllByOrderByNrIdadeMinAsc().stream().map(GrupoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public GrupoDetalheResponse buscarPorId(Long id){
        return GrupoDetalheResponse.de(buscarEntidade(id));
    }

    @Transactional
    public GrupoResponse cadastrar(GrupoRequest request){
        validarFaixa(request, 0L);

        Grupo grupo = new Grupo(request.nmGrupo(), request.nrIdadeMin(), request.nrIdadeMax());

        return GrupoResponse.de(grupoRepository.save(grupo));
    }

    @Transactional
    public GrupoResponse atualizar(Long id, GrupoRequest request){
        Grupo grupo = buscarEntidade(id);

        validarFaixa(request, id);

        grupo.setNmGrupo(request.nmGrupo());
        grupo.setNrIdadeMin(request.nrIdadeMin());
        grupo.setNrIdadeMax(request.nrIdadeMax());
        return GrupoResponse.de(grupo);
    }

    @Transactional
    public void excluir(Long id){
        Grupo grupo = buscarEntidade(id);
        if(!grupo.getSubgrupos().isEmpty()){
            throw new ConflitoException("Exclua os subgrupos antes de excluir o grupo!");
        }
        grupoRepository.delete(grupo);
    }

    public Grupo buscarEntidade(Long id){
        return grupoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Grupo não encontrado!"));
    }

    private void validarFaixa(GrupoRequest request, Long ignorarId){
        if(request.nrIdadeMin() > request.nrIdadeMax()){
            throw new RequisicaoInvalidaException("A idade mínima não pode ser maior que a máxima!");
        }
        if (grupoRepository.existeSobreposicao(request.nrIdadeMin(), request.nrIdadeMax(), ignorarId)) {
            throw new ConflitoException("A faixa etária se sobrepoe a outro grupo!");
        }
    }
}
