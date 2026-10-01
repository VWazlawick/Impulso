package com.impulso.repository;

import com.impulso.model.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmpresaRepository extends JpaRepository<Empresa, Long> {
}
