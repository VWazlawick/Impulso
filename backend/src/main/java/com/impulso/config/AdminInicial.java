package com.impulso.config;

import com.impulso.enums.TipoUsuarioEnum;
import com.impulso.model.Usuario;
import com.impulso.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminInicial implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String senha;

    public AdminInicial(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
                        @Value("${app.admin.email}") String email,
                        @Value("${app.admin.senha}") String senha) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.senha = senha;
    }

    @Override
    public void run(String... args){
        if (email.isBlank() || senha.isBlank() || usuarioRepository.existsByTpUsuario(TipoUsuarioEnum.ADMIN) ||
        usuarioRepository.existsByEmail(email)){
            return;
        }
        usuarioRepository.save(new Usuario(email, passwordEncoder.encode(senha), TipoUsuarioEnum.ADMIN));
    }
}
