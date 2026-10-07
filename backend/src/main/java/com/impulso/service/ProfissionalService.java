package com.impulso.service;

import com.impulso.dto.ProfissionalRequest;
import com.impulso.dto.ProfissionalResponse;
import com.impulso.exception.ConflitoException;
import com.impulso.exception.RecursoNaoEncontradoException;
import com.impulso.model.Empresa;
import com.impulso.model.Profissional;
import com.impulso.repository.PessoaRepository;
import com.impulso.repository.ProfissionalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProfissionalService {

    private final ProfissionalRepository profissionalRepository;
    private final PessoaRepository pessoaRepository;
    private final EmpresaService empresaService;

    public ProfissionalService(ProfissionalRepository profissionalRepository, PessoaRepository pessoaRepository, EmpresaService empresaService) {
        this.profissionalRepository = profissionalRepository;
        this.pessoaRepository = pessoaRepository;
        this.empresaService = empresaService;
    }

    @Transactional
    public ProfissionalResponse cadastrar(ProfissionalRequest request){
        if(pessoaRepository.existsByCpf(request.cpf())){
            throw new ConflitoException("CPF já cadastrado");
        }
        Empresa empresa = empresaService.buscarEmpresaAtual();
        Profissional profissional = new Profissional(request.nmPessoa(), request.cpf(), request.email(), empresa);

        return ProfissionalResponse.de(profissionalRepository.save(profissional));
    }

    @Transactional(readOnly = true)
    public List<ProfissionalResponse> listar(){
        return profissionalRepository.findAllByOrderByNmPessoaAsc().stream().map(ProfissionalResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public ProfissionalResponse buscarPorId(Long id){
        return ProfissionalResponse.de(buscarEntidade(id));
    }

    @Transactional
    public ProfissionalResponse atualizar(Long id, ProfissionalRequest request){
        Profissional profissional = buscarEntidade(id);
        if(pessoaRepository.existsByCpfAndIdNot(request.cpf(), id)){
            throw new ConflitoException("CPF já cadastrado!");
        }
        profissional.setNmPessoa(request.nmPessoa());
        profissional.setCpf(request.cpf());
        profissional.setEmail(request.email());

        return ProfissionalResponse.de(profissional);
    }

    private Profissional buscarEntidade(Long id){
        return profissionalRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Profissional não encontrado!"));
    }
}
