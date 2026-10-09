package com.impulso.repository;

import com.impulso.model.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AlunoRepository extends JpaRepository<Aluno, Long> {

    List<Aluno> findByProfissionalId(Long profissionalId);

    List<Aluno> findByResponsaveisId(Long responsavelId);

    List<Aluno> findByProfissionalIdOrderByNmPessoaAsc(Long profissionalId);

    Optional<Aluno> findByIdAndProfissionalId(Long id, Long profissionalId);

    List<Aluno> findAllByOrderByNmPessoaAsc();
}
