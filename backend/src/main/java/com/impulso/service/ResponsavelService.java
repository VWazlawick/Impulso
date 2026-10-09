package com.impulso.service;

import com.impulso.dto.ProfissionalRequest;
import com.impulso.dto.ProfissionalResponse;
import com.impulso.dto.ResponsavelRequest;
import com.impulso.dto.ResponsavelResponse;
import com.impulso.exception.ConflitoException;
import com.impulso.exception.RecursoNaoEncontradoException;
import com.impulso.model.Responsavel;
import com.impulso.repository.AlunoRepository;
import com.impulso.repository.PessoaRepository;
import com.impulso.repository.ResponsavelRepository;
import com.impulso.security.Solicitante;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ResponsavelService {

    private final ResponsavelRepository responsavelRepository;
    private final AlunoRepository alunoRepository;

    public ResponsavelService(ResponsavelRepository responsavelRepository, AlunoRepository alunoRepository) {
        this.responsavelRepository = responsavelRepository;
        this.alunoRepository = alunoRepository;
    }

    @Transactional(readOnly = true)
    public List<ResponsavelResponse> listar(String nome, Solicitante solicitante){
        String trecho = (nome==null) ? "" : nome.trim();

        List<Responsavel> responsaveis;

        if(solicitante.admin()){
            responsaveis = responsavelRepository.findByNmPessoaContainingIgnoreCaseOrderByNmPessoaAsc(trecho);
        }
        else{
            responsaveis = responsavelRepository.buscarDoProfissional(solicitante.usuarioId(), trecho);
        }
        return responsaveis.stream().map(ResponsavelResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public ResponsavelResponse buscarPorId(Long id, Solicitante solicitante){
        return ResponsavelResponse.de(buscarPermitido(id, solicitante));
    }

    @Transactional
    public ResponsavelResponse atualizar(Long id, ResponsavelRequest request, Solicitante solicitante){
        Responsavel responsavel = buscarPermitido(id, solicitante);
        responsavel.setNmPessoa(request.nmPessoa());
        responsavel.setNrTelefone(request.nrTelefone());
        return ResponsavelResponse.de(responsavel);
    }

    public Responsavel buscarPermitido(Long id, Solicitante solicitante){
        Responsavel responsavel = responsavelRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Responsável não encontrado!"));

        if(!solicitante.admin() && !alunoRepository.existsByResponsaveisIdAndProfissionalUsuarioId(id, solicitante.usuarioId())){
            throw new RecursoNaoEncontradoException("Responsável não encontrado!");
        }
        return responsavel;
    }

}
