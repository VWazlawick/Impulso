package com.impulso.controller;

import com.impulso.dto.SubgrupoRequest;
import com.impulso.dto.SubgrupoResponse;
import com.impulso.service.SubgrupoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@PreAuthorize("hasRole('ADMIN')")
public class SubgrupoController {

    private final SubgrupoService subgrupoService;

    public SubgrupoController(SubgrupoService subgrupoService) {
        this.subgrupoService = subgrupoService;
    }

    @PostMapping("/grupo/{grupoId}/subgrupo")
    @ResponseStatus(HttpStatus.CREATED)
    public SubgrupoResponse cadastrar(@PathVariable Long grupoId, @RequestBody @Valid SubgrupoRequest request){
        return subgrupoService.cadastrar(grupoId, request);
    }

    @PutMapping("/subgrupo/{id}")
    public SubgrupoResponse atualizar(@PathVariable Long id, @RequestBody @Valid SubgrupoRequest request){
        return subgrupoService.atualizar(id, request);
    }

    @DeleteMapping("/subgrupo/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id){
        subgrupoService.excluir(id);
    }
}
