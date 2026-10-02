package com.impulso.service;

import com.impulso.dto.LoginRequest;
import com.impulso.dto.LoginResponse;
import com.impulso.model.Usuario;
import com.impulso.repository.UsuarioRepository;
import com.impulso.security.TokenService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private TokenService tokenService;

    public AuthService(AuthenticationManager authenticationManager, UsuarioRepository usuarioRepository, TokenService tokenService) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.tokenService = tokenService;
    }

    public LoginResponse login(LoginRequest request){
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.senha()));

        Usuario usuario = usuarioRepository.findByEmail(request.email()).orElseThrow();
        String token = tokenService.gerarToken(usuario);
        return new LoginResponse(token, usuario.getTpUsuario().name());
    }
}
