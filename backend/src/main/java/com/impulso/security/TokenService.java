package com.impulso.security;

import com.impulso.model.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
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
                .claim("carimboSenha", carimboDaSenha(usuario.getSnUsuario()))
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header,claims)).getTokenValue();
    }

    // Um resumo curto da senha guardada (do hash do BCrypt, não da senha em si). Quando a senha
    // muda, o carimbo muda junto e os tokens antigos deixam de valer (veja o UsuarioAtivoValidator).
    public static String carimboDaSenha(String snUsuario){
        try {
            byte[] resumo = MessageDigest.getInstance("SHA-256").digest(snUsuario.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(resumo).substring(0, 16);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
