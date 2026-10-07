package com.impulso.service;

import com.impulso.dto.AlunoRequest;
import com.impulso.dto.AlunoResponse;
import com.impulso.dto.ResponsavelResponse;
import com.impulso.exception.ConflitoException;
import com.impulso.exception.RecursoNaoEncontradoException;
import com.impulso.model.Aluno;
import com.impulso.model.Profissional;
import com.impulso.model.Responsavel;
import com.impulso.repository.AlunoRepository;
import com.impulso.repository.PessoaRepository;
import com.impulso.repository.ProfissionalRepository;
import com.impulso.repository.ResponsavelRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AlunoService {

    private final AlunoRepository alunoRepository;
    private final PessoaRepository pessoaRepository;
    private final ProfissionalRepository profissionalRepository;
    private final ResponsavelRepository responsavelRepository;

    public AlunoService(AlunoRepository alunoRepository, PessoaRepository pessoaRepository,
                        ProfissionalRepository profissionalRepository,
                        ResponsavelRepository responsavelRepository) {
        this.alunoRepository = alunoRepository;
        this.pessoaRepository = pessoaRepository;
        this.profissionalRepository = profissionalRepository;
        this.responsavelRepository = responsavelRepository;
    }

    @Transactional
    public AlunoResponse cadastrar(AlunoRequest request, Long usuarioId) {
        Profissional profissional = profissionalLogado(usuarioId);
        if (request.cpf() != null && pessoaRepository.existsByCpf(request.cpf())) {
            throw new ConflitoException("CPF já cadastrado!");
        }

        Aluno aluno = new Aluno(request.nmPessoa(), request.cpf(), request.email(), request.dtNascimento(),
                request.tpServico(), profissional);
        return AlunoResponse.de(alunoRepository.save(aluno));
    }

    @Transactional(readOnly = true)
    public List<AlunoResponse> listar(Long usuarioId) {
        Profissional profissional = profissionalLogado(usuarioId);
        return alunoRepository.findByProfissionalIdOrderByNmPessoaAsc(profissional.getId()).stream().map(AlunoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public AlunoResponse buscarPorId(Long alunoId, Long usuarioId) {
        return AlunoResponse.de(buscarAlunoDoProfissional(alunoId, usuarioId));
    }

    @Transactional
    public AlunoResponse atualizarId(Long alunoId, Long usuarioId, AlunoRequest request) {
        Aluno aluno = buscarAlunoDoProfissional(alunoId, usuarioId);
        if (request.cpf() != null && pessoaRepository.existsByCpfAndIdNot(request.cpf(), alunoId)) {
            throw new ConflitoException("CPF já cadastrado!");
        }

        aluno.setNmPessoa(request.nmPessoa());
        aluno.setCpf(request.cpf());
        aluno.setEmail(request.email());
        aluno.setDtNascimento(request.dtNascimento());
        aluno.setTpServico(request.tpServico());
        return AlunoResponse.de(aluno);
    }

    @Transactional
    public void vincularResponsavel(Long alunoId, Long responsavelId, Long usuarioId) {
        Aluno aluno = buscarAlunoDoProfissional(alunoId, usuarioId);
        Responsavel responsavel = buscarResponsavel(responsavelId);

        if (aluno.getResponsaveis().contains(responsavel)) {
            throw new ConflitoException("Responsável já vinculado a este aluno!");
        }
        aluno.getResponsaveis().add(responsavel);
    }

    @Transactional
    public void desvincularResponsavel(Long alunoId, Long responsavelId, Long usuarioId) {
        Aluno aluno = buscarAlunoDoProfissional(alunoId, usuarioId);
        Responsavel responsavel = buscarResponsavel(responsavelId);

        if (!aluno.getResponsaveis().remove(responsavel)) {
            throw new RecursoNaoEncontradoException("Responsável não vinculado a este Aluno!");
        }
    }

    @Transactional(readOnly = true)
    public List<ResponsavelResponse> listarResponsaveis(Long alunoId, Long usuarioId) {
        return buscarAlunoDoProfissional(alunoId, usuarioId).getResponsaveis().stream().map(ResponsavelResponse::de).toList();
    }

    private Profissional profissionalLogado(Long usuarioId) {
        return profissionalRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new AccessDeniedException("Somente um profissional pode alterar o cadastro!"));
    }

    private Aluno buscarAlunoDoProfissional(Long alunoId, Long usuarioId) {
        Profissional profissional = profissionalLogado(usuarioId);
        return alunoRepository.findByIdAndProfissionalId(alunoId, profissional.getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Aluno não encontrado!"));
    }

    private Responsavel buscarResponsavel(Long responsavelId) {
        return responsavelRepository.findById(responsavelId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Responsável não encontrado!"));
    }
}
