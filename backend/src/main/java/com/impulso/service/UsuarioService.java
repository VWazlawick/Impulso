package com.impulso.service;

import com.impulso.dto.*;
import com.impulso.enums.TipoUsuarioEnum;
import com.impulso.exception.ConflitoException;
import com.impulso.exception.RecursoNaoEncontradoException;
import com.impulso.model.Pessoa;
import com.impulso.model.Profissional;
import com.impulso.model.Responsavel;
import com.impulso.model.Usuario;
import com.impulso.repository.PessoaRepository;
import com.impulso.repository.UsuarioRepository;
import com.impulso.security.Solicitante;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PessoaRepository pessoaRepository;
    private final PasswordEncoder passwordEncoder;
    private final ResponsavelService responsavelService;

    public UsuarioService(UsuarioRepository usuarioRepository, PessoaRepository pessoaRepository, PasswordEncoder passwordEncoder, ResponsavelService responsavelService) {
        this.usuarioRepository = usuarioRepository;
        this.pessoaRepository = pessoaRepository;
        this.passwordEncoder = passwordEncoder;
        this.responsavelService = responsavelService;
    }

    @Transactional
    public UsuarioResponse criarAcesso(UsuarioRequest request, Solicitante solicitante){
        Pessoa pessoa = pessoaRepository.findById(request.pessoaId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pessoa não encontrada!"));

        if(pessoa instanceof Profissional profissional){
            if(!solicitante.admin()){
                throw new AccessDeniedException("Somente administrador podem criar acessos de profissional!");
            }
            validarSemAcesso(profissional.getUsuario());
            Usuario usuario = salvarNovoUsuario(request.email(), request.senha(), TipoUsuarioEnum.PROFISSIONAL);
            profissional.setUsuario(usuario);
            return UsuarioResponse.de(usuario);
        }

        if(pessoa instanceof Responsavel responsavel){
            responsavelService.buscarPermitido(responsavel.getId(), solicitante);
            validarSemAcesso(responsavel.getUsuario());
            Usuario usuario = salvarNovoUsuario(request.email(), request.senha(), TipoUsuarioEnum.RESPONSAVEL);
            responsavel.setUsuario(usuario);
            return UsuarioResponse.de(usuario);
        }
        throw new ConflitoException("Alunos não possuem acesso ao sistema!");
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscarPorId(Long id){
        return UsuarioResponse.de(buscarEntidade(id));
    }

    @Transactional
    public UsuarioResponse atualizar(Long id, AtualizarUsuarioRequest request){
        Usuario usuario = buscarEntidade(id);
        if(usuarioRepository.existsByEmailAndIdNot(request.email(), id)){
            throw new ConflitoException("Email já cadastrado!");
        }

        usuario.setEmail(request.email());
        if(request.senha() != null){
            usuario.setSnUsuario(passwordEncoder.encode(request.senha()));
        }
        return UsuarioResponse.de(usuario);
    }

    @Transactional
    public void inativar(Long id, Long idSolicitante){
        Usuario usuario = buscarEntidade(id);

        if(usuario.getId().equals(idSolicitante)){
            throw new ConflitoException("Você não pode bloquear o próprio acesso!");
        }
        if(usuario.getTpUsuario() == TipoUsuarioEnum.ADMIN && usuario.isStAtivo() &&
        usuarioRepository.countByTpUsuarioAndStAtivoTrue(TipoUsuarioEnum.ADMIN)<=1 ){
            throw new ConflitoException("É preciso manter pelo menos 1 admin ativo!");
        }

        usuario.setStAtivo(false);
    }

    @Transactional
    public void reativar(Long id){
        buscarEntidade(id).setStAtivo(true);
    }

    @Transactional
    public UsuarioResponse cadastrarAdmin(AdminRequest request){
        return UsuarioResponse.de(salvarNovoUsuario(request.email(), request.senha(), TipoUsuarioEnum.ADMIN));
    }

    @Transactional(readOnly = true)
    public List<UsuarioListaResponse> listar(){
        return usuarioRepository.listarComNome();
    }

    private void validarSemAcesso(Usuario usuarioAtual){
        if(usuarioAtual != null){
            throw new ConflitoException("Esta pessoa já possui acesso");
        }
    }

    private Usuario salvarNovoUsuario(String email, String senha, TipoUsuarioEnum tipo){
        if(usuarioRepository.existsByEmail(email)){
            throw new ConflitoException("Email já cadastrado!");
        }
        String senhaCriptografado = passwordEncoder.encode(senha);
        return usuarioRepository.save(new Usuario(email, senhaCriptografado, tipo));
    }

    private Usuario buscarEntidade(Long id){
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado!"));
    }
}
