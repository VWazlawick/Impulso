package com.impulso.repository;

import com.impulso.enums.TipoIndicadorEnum;
import com.impulso.model.Classificacao;
import com.impulso.model.Subgrupo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassificacaoRepository extends JpaRepository<Classificacao, Long> {

    List<Classificacao>
    findByTpIndicadorAndSubgrupoOrderByTpSexoAscNrIdadeMinAscVlInicioAsc(TipoIndicadorEnum tpIndicador, Subgrupo subgrupo);

    boolean existsBySubgrupoId(Long subgrupo);
}
