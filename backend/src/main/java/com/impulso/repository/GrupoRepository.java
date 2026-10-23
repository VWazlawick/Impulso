package com.impulso.repository;

import com.impulso.model.Grupo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface GrupoRepository extends JpaRepository<Grupo, Long> {

    List<Grupo> findAllByOrderByNrIdadeMinAsc();

    @Query("""
            select count(g) > 0 from Grupo g
            where g.id <> :ignorarId
              and g.nrIdadeMin <= :idadeMax
              and g.nrIdadeMax >= :idadeMin
            """)
    boolean existeSobreposicao(Integer idadeMin, Integer idadeMax, Long ignorarId);

    @Query("SELECT g FROM Grupo g WHERE :idade BETWEEN g.nrIdadeMin and g.nrIdadeMax")
    Optional<Grupo> buscarPorIdade(Integer idade);
}