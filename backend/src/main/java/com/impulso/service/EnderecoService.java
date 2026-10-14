package com.impulso.service;

import com.impulso.dto.EnderecoRequest;
import com.impulso.dto.EnderecoResponse;
import com.impulso.exception.RecursoNaoEncontradoException;
import com.impulso.model.Aluno;
import com.impulso.model.Cidade;
import com.impulso.model.Endereco;
import com.impulso.repository.CidadeRepository;
import com.impulso.repository.EnderecoRepository;
import com.impulso.security.Solicitante;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EnderecoService {

    private final EnderecoRepository enderecoRepository;
    private final CidadeRepository cidadeRepository;
    private final AlunoService alunoService;

    public EnderecoService(EnderecoRepository enderecoRepository, CidadeRepository cidadeRepository, AlunoService alunoService) {
        this.enderecoRepository = enderecoRepository;
        this.cidadeRepository = cidadeRepository;
        this.alunoService = alunoService;
    }

    @Transactional(readOnly = true)
    public List<EnderecoResponse> listar(Long alunoId, Solicitante solicitante){
        Aluno aluno = alunoService.buscarAlunoPermitido(alunoId, solicitante);
        return enderecoRepository.findByAlunoId(aluno.getId()).stream().map(EnderecoResponse ::de).toList();
    }

    @Transactional
    public EnderecoResponse cadastrar(Long alunoId, EnderecoRequest request,Solicitante solicitante){
        Aluno aluno = alunoService.buscarAlunoPermitido(alunoId, solicitante);
        Endereco endereco = new Endereco(request.rua(), request.nrCasa(), request.bairro(), request.cep(), request.complemento(),
                buscarCidade(request.cidadeId()), aluno);
        return EnderecoResponse.de(enderecoRepository.save(endereco));
    }

    @Transactional
    public EnderecoResponse atualizar(Long alunoId, Long enderecoId, EnderecoRequest request, Solicitante solicitante){
        Endereco endereco = buscarEnderecoPermitido(alunoId, enderecoId, solicitante);
        endereco.setRua(request.rua());
        endereco.setNrCasa(request.nrCasa());
        endereco.setBairro(request.bairro());
        endereco.setCep(request.cep());
        endereco.setComplemento(request.complemento());
        endereco.setCidade(buscarCidade(request.cidadeId()));
        return EnderecoResponse.de(endereco);
    }

    @Transactional
    public void excluir(Long alunoId, Long enderecoId, Solicitante solicitante){
        enderecoRepository.delete(buscarEnderecoPermitido(alunoId, enderecoId, solicitante));
    }

    private Endereco buscarEnderecoPermitido(Long alunoId, Long enderecoId, Solicitante solicitante){
        alunoService.buscarAlunoPermitido(alunoId, solicitante);
        return enderecoRepository.findByIdAndAlunoId(enderecoId, alunoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Endereço não encontrado!"));
    }

    private Cidade buscarCidade(Long cidadeId){
        return cidadeRepository.findById(cidadeId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cidade não encontrada!"));
    }
}
