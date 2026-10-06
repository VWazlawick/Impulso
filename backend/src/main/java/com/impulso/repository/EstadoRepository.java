package com.impulso.repository;

import com.impulso.model.Estado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EstadoRepository extends JpaRepository<Estado, Long> {

    List<Estado> findByPaisId(Long paisId);

    List<Estado> findByNmEstado(String nmEstado);

    List<Estado> findByPaisIdOrderByNmEstadoAsc(Long paisId);
}
