package com.impulso.repository;

import com.impulso.model.Responsavel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ResponsavelRepository extends JpaRepository<Responsavel, Long> {

    Optional<Responsavel> findByUsuarioId(Long usuarioId);

    boolean existsByCpf(String cpf);
}
