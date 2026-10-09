package com.impulso.service;

import com.impulso.dto.AtualizarUsuarioRequest;
import com.impulso.dto.UsuarioRequest;
import com.impulso.dto.UsuarioResponse;
import com.impulso.enums.TipoUsuarioEnum;
import com.impulso.exception.ConflitoException;
import com.impulso.exception.RecursoNaoEncontradoException;
import com.impulso.model.Pessoa;
import com.impulso.model.Profissional;
import com.impulso.model.Responsavel;
import com.impulso.model.Usuario;
import com.impulso.repository.PessoaRepository;
import com.impulso.repository.UsuarioRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PessoaRepository pessoaRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PessoaRepository pessoaRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.pessoaRepository = pessoaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UsuarioResponse criarAcesso(UsuarioRequest request, boolean solicitanteAdmin){
        Pessoa pessoa = pessoaRepository.findById(request.pessoaId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pessoa não encontrada!"));

        if(pessoa instanceof Profissional profissional){
            if(!solicitanteAdmin){
                throw new AccessDeniedException("Somente administrador podem criar acessos de profissional!");
            }
            validarSemAcesso(profissional.getUsuario());
            Usuario usuario = salvarNovoUsuario(request, TipoUsuarioEnum.PROFISSIONAL);
            profissional.setUsuario(usuario);
            return UsuarioResponse.de(usuario);
        }

        if(pessoa instanceof Responsavel responsavel){
            validarSemAcesso(responsavel.getUsuario());
            Usuario usuario = salvarNovoUsuario(request, TipoUsuarioEnum.RESPONSAVEL);
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
    public void inativar(Long id){
        buscarEntidade(id).setStAtivo(false);
    }

    @Transactional
    public void reativar(Long id){
        buscarEntidade(id).setStAtivo(true);
    }

    private void validarSemAcesso(Usuario usuarioAtual){
        if(usuarioAtual != null){
            throw new ConflitoException("Esta pessoa já possui acesso");
        }
    }

    private Usuario salvarNovoUsuario(UsuarioRequest request, TipoUsuarioEnum tipo){
        if(usuarioRepository.existsByEmail(request.email())){
            throw new ConflitoException("Email já cadastrado!");
        }
        String senhaCriptografado = passwordEncoder.encode(request.senha());
        return usuarioRepository.save(new Usuario(request.email(), senhaCriptografado, tipo));
    }

    private Usuario buscarEntidade(Long id){
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado!"));
    }
}
