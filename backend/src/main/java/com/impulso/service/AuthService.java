package com.impulso.service;

import com.impulso.dto.LoginRequest;
import com.impulso.dto.LoginResponse;
import com.impulso.model.Usuario;
import com.impulso.repository.UsuarioRepository;
import com.impulso.security.TentativasLogin;
import com.impulso.security.TokenService;
import com.impulso.utils.NormalizadorEmail;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final TokenService tokenService;
    private final TentativasLogin tentativasLogin;

    public AuthService(AuthenticationManager authenticationManager, UsuarioRepository usuarioRepository,
                       TokenService tokenService, TentativasLogin tentativasLogin) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.tokenService = tokenService;
        this.tentativasLogin = tentativasLogin;
    }

    public LoginResponse login(LoginRequest request){
        String email = NormalizadorEmail.normalizar(request.email());
        tentativasLogin.verificar(email);

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.senha()));
        } catch (AuthenticationException e) {
            tentativasLogin.registrarFalha(email);
            throw e;
        }
        tentativasLogin.limpar(email);

        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(email).orElseThrow();
        String token = tokenService.gerarToken(usuario);
        return new LoginResponse(token, usuario.getTpUsuario().name());
    }
}
