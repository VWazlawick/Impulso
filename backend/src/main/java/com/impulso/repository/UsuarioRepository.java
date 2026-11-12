package com.impulso.repository;

import com.impulso.dto.UsuarioListaResponse;
import com.impulso.enums.TipoUsuarioEnum;
import com.impulso.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    // Sem diferença entre maiúsculas e minúsculas: e-mails antigos podem ter sido gravados com maiúsculas.
    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    boolean existsByTpUsuario(TipoUsuarioEnum tpUsuario);

    long countByTpUsuarioAndStAtivoTrue(TipoUsuarioEnum tpUsuario);

    // O nome vem do profissional ou do responsável dono do acesso; admin não tem pessoa e fica sem nome.
    @Query("""
        select new com.impulso.dto.UsuarioListaResponse(
            u.id, u.email, u.tpUsuario, u.stAtivo, coalesce(p.nmPessoa, r.nmPessoa))
        from Usuario u
        left join Profissional p on p.usuario = u
        left join Responsavel r on r.usuario = u
        order by u.tpUsuario, coalesce(p.nmPessoa, r.nmPessoa, u.email)
        """)
    List<UsuarioListaResponse> listarComNome();
}
