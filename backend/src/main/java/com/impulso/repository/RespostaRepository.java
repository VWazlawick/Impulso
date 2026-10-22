package com.impulso.repository;

import com.impulso.model.Resposta;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RespostaRepository extends JpaRepository<Resposta, Long> {

    boolean existsByPerguntaId(Long perguntaid);

    boolean existsByPerguntaSubgrupoId(Long subgrupoId);
}
