package com.impulso.repository;

import com.impulso.model.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlunoRepository extends JpaRepository<Aluno, Long> {

    List<Aluno> findByProfissionalId(Long profissionalId);

    boolean existByCpf(String cpf);

    List<Aluno> findByResponsavelId(Long responsavelId);
}
