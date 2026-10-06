package com.impulso.repository;

import com.impulso.model.Pais;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaisRepository extends JpaRepository<Pais, Long> {

    List<Pais> findByNmPais(String nmPais);

    List<Pais> findAllByOrderByNmPaisAsc();
}
