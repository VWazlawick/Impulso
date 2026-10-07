package com.impulso.repository;

import com.impulso.model.Pessoa;
import com.impulso.model.Profissional;
import com.impulso.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProfissionalRepository extends JpaRepository<Profissional, Long> {

    Optional<Profissional> findByUsuarioId(Long usuarioId);

    List<Profissional> findAllByOrderByNmPessoaAsc();

    Long usuario(Usuario usuario);
}
