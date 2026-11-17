package com.impulso.service;

import com.impulso.clientes.CatalogoClientes;
import com.impulso.clientes.ClienteAtual;
import com.impulso.clientes.DiretorioLogins;
import com.impulso.dto.LoginRequest;
import com.impulso.dto.LoginResponse;
import com.impulso.model.Usuario;
import com.impulso.repository.UsuarioRepository;
import com.impulso.security.TentativasLogin;
import com.impulso.security.TokenService;
import com.impulso.utils.NormalizadorEmail;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final TokenService tokenService;
    private final TentativasLogin tentativasLogin;
    private final DiretorioLogins diretorioLogins;
    private final CatalogoClientes catalogoClientes;
    private final PasswordEncoder passwordEncoder;
    private final String hashFicticio;

    public AuthService(AuthenticationManager authenticationManager, UsuarioRepository usuarioRepository,
                       TokenService tokenService, TentativasLogin tentativasLogin, DiretorioLogins diretorioLogins,
                       CatalogoClientes catalogoClientes, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.tokenService = tokenService;
        this.tentativasLogin = tentativasLogin;
        this.diretorioLogins = diretorioLogins;
        this.catalogoClientes = catalogoClientes;
        this.passwordEncoder = passwordEncoder;
        this.hashFicticio = passwordEncoder.encode("senha-que-ninguem-usa");
    }

    // O e-mail diz de qual cliente é o login (lista central); a senha é conferida no banco desse cliente.
    public LoginResponse login(LoginRequest request){
        String email = NormalizadorEmail.normalizar(request.email());
        tentativasLogin.verificar(email);

        Long clienteId = diretorioLogins.clienteDoEmail(email).filter(catalogoClientes::estaAtivo).orElse(null);
        try {
            if(clienteId == null){
                // Confere uma senha qualquer para gastar o mesmo tempo de um login de verdade:
                // assim nem pela demora dá para saber se o e-mail existe.
                passwordEncoder.matches(request.senha(), hashFicticio);
                throw new BadCredentialsException("E-mail sem cliente");
            }
            ClienteAtual.executar(clienteId, () -> authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.senha())));
        } catch (AuthenticationException e) {
            tentativasLogin.registrarFalha(email);
            throw e;
        }
        tentativasLogin.limpar(email);

        Usuario usuario = ClienteAtual.executar(clienteId, () -> usuarioRepository.findByEmailIgnoreCase(email).orElseThrow());
        String token = tokenService.gerarToken(usuario, clienteId);
        return new LoginResponse(token, usuario.getTpUsuario().name());
    }
}
