package com.impulso.repository;

import com.impulso.model.Responsavel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ResponsavelRepository extends JpaRepository<Responsavel, Long> {

    Optional<Responsavel> findByUsuarioId(Long usuarioId);

    List<Responsavel> findByNmPessoaContainingIgnoreCaseOrderByNmPessoaAsc(String nmPessoa);

    @Query("""
        select distinct r from Aluno a join a.responsaveis r
        where a.profissional.usuario.id = :usuarioId
          and lower(r.nmPessoa) like lower(concat('%', :nome, '%'))
        order by r.nmPessoa
        """)
    List<Responsavel> buscarDoProfissional(Long usuarioId, String nome);
}
