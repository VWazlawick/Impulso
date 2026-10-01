package com.impulso.security;

import com.impulso.model.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class TokenService {

    private final JwtEncoder jwtEncoder;
    private final Long expirationMs;

    public TokenService(JwtEncoder jwtEncoder, @Value("${app.jwt.expiration-ms}") long expirationMs){
        this.jwtEncoder = jwtEncoder;
        this.expirationMs = expirationMs;
    }

    public String gerarToken(Usuario usuario){
        Instant agora = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("impulso")
                .issuedAt(agora)
                .expiresAt(agora.plusMillis(expirationMs))
                .subject(usuario.getEmail())
                .claim("usuarioId", usuario.getId())
                .claim("roles", List.of(usuario.getTpUsuario().name()))
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header,claims)).getTokenValue();
    }
}
