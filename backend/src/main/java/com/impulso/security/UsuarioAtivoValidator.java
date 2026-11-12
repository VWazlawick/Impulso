package com.impulso.security;

import com.impulso.model.Usuario;
import com.impulso.repository.UsuarioRepository;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

// Confere, a cada pedido, se o dono do token ainda pode usar o sistema: o usuário existe,
// não foi bloqueado e não trocou de senha depois que o token foi gerado. Se algo mudou,
// o pedido volta 401 e o frontend leva para o login.
@Component
public class UsuarioAtivoValidator implements OAuth2TokenValidator<Jwt> {

    private static final OAuth2Error ACESSO_ENCERRADO =
            new OAuth2Error("invalid_token", "Acesso bloqueado ou senha alterada", null);

    private final UsuarioRepository usuarioRepository;

    public UsuarioAtivoValidator(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt){
        Object id = jwt.getClaim("usuarioId");
        String carimbo = jwt.getClaimAsString("carimboSenha");
        if(!(id instanceof Number numero) || carimbo == null){
            return OAuth2TokenValidatorResult.failure(ACESSO_ENCERRADO);
        }

        boolean valido = usuarioRepository.findById(numero.longValue())
                .filter(Usuario::isStAtivo)
                .filter(usuario -> TokenService.carimboDaSenha(usuario.getSnUsuario()).equals(carimbo))
                .isPresent();
        return valido ? OAuth2TokenValidatorResult.success() : OAuth2TokenValidatorResult.failure(ACESSO_ENCERRADO);
    }
}
