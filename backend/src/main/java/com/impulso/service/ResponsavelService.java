package com.impulso.service;

import com.impulso.dto.ProfissionalRequest;
import com.impulso.dto.ProfissionalResponse;
import com.impulso.dto.ResponsavelRequest;
import com.impulso.dto.ResponsavelResponse;
import com.impulso.exception.ConflitoException;
import com.impulso.exception.RecursoNaoEncontradoException;
import com.impulso.model.Responsavel;
import com.impulso.repository.PessoaRepository;
import com.impulso.repository.ResponsavelRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ResponsavelService {

    private final ResponsavelRepository responsavelRepository;
    private final PessoaRepository pessoaRepository;

    public ResponsavelService(ResponsavelRepository responsavelRepository, PessoaRepository pessoaRepository) {
        this.responsavelRepository = responsavelRepository;
        this.pessoaRepository = pessoaRepository;
    }

    @Transactional
    public ResponsavelResponse cadastrar(ResponsavelRequest request){
        if(pessoaRepository.existsByCpf(request.cpf())){
            throw new ConflitoException("CPF já cadastrado!");
        }

        Responsavel responsavel = new Responsavel(request.nmPessoa(), request.cpf(), request.email());
        return ResponsavelResponse.de(responsavelRepository.save(responsavel));
    }

    @Transactional(readOnly = true)
    public List<ResponsavelResponse> listar(){
        return responsavelRepository.findAllByOrderByNmPessoaAsc().stream().map(ResponsavelResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public ResponsavelResponse buscarPorId(Long id){
        return ResponsavelResponse.de(buscarEntidade(id));
    }

    @Transactional(readOnly = true)
    public List<ResponsavelResponse> buscarPorNome(String trecho){
        return responsavelRepository.findByNmPessoaContainingIgnoreCase(trecho).stream().map(ResponsavelResponse::de).toList();
    }

    @Transactional
    public ResponsavelResponse atualizar(Long id, ResponsavelRequest request){
        Responsavel responsavel = buscarEntidade(id);
        if (pessoaRepository.existsByCpfAndIdNot(request.cpf(), id)){
            throw new ConflitoException("CPF já cadastrado!");
        }

        responsavel.setNmPessoa(request.nmPessoa());
        responsavel.setCpf(request.cpf());
        responsavel.setEmail(request.email());

        return ResponsavelResponse.de(responsavel);
    }

    private Responsavel buscarEntidade(Long id){
        return responsavelRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Responsável não encontrado!"));
    }

}
