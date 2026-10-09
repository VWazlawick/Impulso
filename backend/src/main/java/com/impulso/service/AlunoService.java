package com.impulso.service;

import com.impulso.dto.*;
import com.impulso.exception.ConflitoException;
import com.impulso.exception.RecursoNaoEncontradoException;
import com.impulso.exception.RequisicaoInvalidaException;
import com.impulso.model.Aluno;
import com.impulso.model.Profissional;
import com.impulso.model.Responsavel;
import com.impulso.repository.AlunoRepository;
import com.impulso.repository.PessoaRepository;
import com.impulso.repository.ProfissionalRepository;
import com.impulso.repository.ResponsavelRepository;
import com.impulso.security.Solicitante;
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
    private final ResponsavelService responsavelService;

    public AlunoService(AlunoRepository alunoRepository, PessoaRepository pessoaRepository, ProfissionalRepository profissionalRepository, ResponsavelRepository responsavelRepository, ResponsavelService responsavelService) {
        this.alunoRepository = alunoRepository;
        this.pessoaRepository = pessoaRepository;
        this.profissionalRepository = profissionalRepository;
        this.responsavelRepository = responsavelRepository;
        this.responsavelService = responsavelService;
    }

    @Transactional
    public AlunoResponse cadastrar(AlunoRequest request, Solicitante solicitante) {
        Profissional profissional = definirProfissionalDoCadastro(request, solicitante);
        if (request.cpf() != null && pessoaRepository.existsByCpf(request.cpf())) {
            throw new ConflitoException("CPF já cadastrado!");
        }

        Aluno aluno = new Aluno(request.nmPessoa(), request.cpf(), request.email(), request.dtNascimento(),
                request.tpServico(), profissional);
        return AlunoResponse.de(alunoRepository.save(aluno));
    }

    @Transactional(readOnly = true)
    public List<AlunoResponse> listar(Solicitante solicitante) {

        List<Aluno> alunos;
        if(solicitante.admin()){
            alunos = alunoRepository.findAllByOrderByNmPessoaAsc();
        }
        else{
            Profissional profissional = profissionalLogado(solicitante.usuarioId());
            alunos = alunoRepository.findByProfissionalIdOrderByNmPessoaAsc(profissional.getId());
        }
        return alunos.stream().map(AlunoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public AlunoResponse buscarPorId(Long alunoId, Solicitante solicitante) {
        return AlunoResponse.de(buscarAlunoPermitido(alunoId, solicitante));
    }

    @Transactional
    public AlunoResponse atualizarId(Long alunoId, Solicitante solicitante, AlunoRequest request) {
        Aluno aluno = buscarAlunoPermitido(alunoId, solicitante);
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
    public void vincularResponsavel(Long alunoId, Long responsavelId, Solicitante solicitante) {
        Aluno aluno = buscarAlunoPermitido(alunoId, solicitante);
        Responsavel responsavel = responsavelService.buscarPermitido(responsavelId, solicitante);

        if (aluno.getResponsaveis().contains(responsavel)) {
            throw new ConflitoException("Responsável já vinculado a este aluno!");
        }
        aluno.getResponsaveis().add(responsavel);
    }

    @Transactional
    public void desvincularResponsavel(Long alunoId, Long responsavelId, Solicitante solicitante) {
        Aluno aluno = buscarAlunoPermitido(alunoId, solicitante);
        Responsavel responsavel = buscarResponsavel(responsavelId);

        if (!aluno.getResponsaveis().remove(responsavel)) {
            throw new RecursoNaoEncontradoException("Responsável não vinculado a este Aluno!");
        }
    }

    @Transactional(readOnly = true)
    public List<ResponsavelResponse> listarResponsaveis(Long alunoId, Solicitante solicitante) {
        return buscarAlunoPermitido(alunoId, solicitante).getResponsaveis().stream().map(ResponsavelResponse::de).toList();
    }

    @Transactional
    public AlunoResponse transferir(Long alunoId, TransferirAlunoRequest request){
        Aluno aluno = alunoRepository.findById(alunoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Aluno não encontrado!"));
        aluno.setProfissional(buscarProfissional(request.profissionalId()));
        return AlunoResponse.de(aluno);
    }

    @Transactional
    public ResponsavelResponse cadastrarResponsavel(Long alunoId, ResponsavelRequest request, Solicitante solicitante){
        Aluno aluno = buscarAlunoPermitido(alunoId, solicitante);
        Responsavel responsavel = responsavelRepository.save(
                new Responsavel(request.nmPessoa(), request.nrTelefone()));
        aluno.getResponsaveis().add(responsavel);
        return ResponsavelResponse.de(responsavel);
    }

    private Profissional profissionalLogado(Long usuarioId) {
        return profissionalRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new AccessDeniedException("Somente um profissional pode alterar o cadastro!"));
    }

    private Responsavel buscarResponsavel(Long responsavelId) {
        return responsavelRepository.findById(responsavelId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Responsável não encontrado!"));
    }

    private Profissional buscarProfissional(Long profissionalId){
        return profissionalRepository.findById(profissionalId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Profissional não encontrado!"));
    }

    private Profissional definirProfissionalDoCadastro(AlunoRequest request, Solicitante solicitante){
        if(!solicitante.admin()){
            return profissionalLogado(solicitante.usuarioId());
        }
        if(request.profissionalId() == null){
            throw new RequisicaoInvalidaException("Informe o profissional responsável pelo Aluno!");
        }
        return buscarProfissional(request.profissionalId());
    }

    private Aluno buscarAlunoPermitido(Long alunoId, Solicitante solicitante){
        if(solicitante.admin()){
            return alunoRepository.findById(alunoId)
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Aluno não encontrado!"));
        }
        Profissional profissional = profissionalLogado(solicitante.usuarioId());
        return alunoRepository.findByIdAndProfissionalId(alunoId, profissional.getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Aluno não encontrado!"));
    }
}
