package com.impulso.repository;

import com.impulso.model.Cidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CidadeRepository extends JpaRepository<Cidade, Long> {

    List<Cidade> findByEstadoId(Long estadoId);

    List<Cidade> findByNmCidade(String nmCidade);

    List<Cidade> findByEstadoIdOrderByNmCidadeAsc(Long estadoId);

    Optional<Cidade> findByCdIbge(Long cdIbge);
}
