package com.impulso.model;

import com.impulso.enums.TipoUsuarioEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name="usuario")
@Getter
@Setter
@NoArgsConstructor
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String snUsuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoUsuarioEnum tpUsuario;

    public Usuario(String email, String senha, TipoUsuarioEnum tpUsuario) {
        this.email = email;
        this.snUsuario = senha;
        this.tpUsuario = tpUsuario;
    }
}
