package com.impulso.repository;

import com.impulso.model.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {

    List<Avaliacao> findByAlunoIdOrderByDtAvaliacaoDesc(Long alunoId);

    Optional<Avaliacao> findByIdAndAlunoId(Long id, Long alunoId);

    boolean existsByGrupoId(Long grupoId);

    boolean existsByAlunoIdAndDtAvaliacaoAfter(Long alunoId, LocalDate dtAvaliacao);

    List<Avaliacao> findByAlunoIdOrderByDtAvaliacaoAscIdAsc(Long alunoId);
}
