package com.impulso.repository;

import com.impulso.model.Telefone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TelefoneRepository extends JpaRepository<Telefone, Long> {

    List<Telefone> findByAlunoId(Long alunoId);
}
