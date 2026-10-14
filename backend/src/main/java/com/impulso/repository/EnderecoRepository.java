package com.impulso.repository;

import com.impulso.model.Endereco;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EnderecoRepository extends JpaRepository<Endereco, Long> {

    List<Endereco> findByAlunoId(Long alunoId);

    Optional<Endereco> findByIdAndAlunoId(Long id, Long alunoId);
}
