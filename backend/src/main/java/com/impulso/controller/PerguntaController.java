package com.impulso.controller;

import com.impulso.dto.PerguntaRequest;
import com.impulso.dto.PerguntaResponse;
import com.impulso.service.PerguntaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@PreAuthorize("hasRole('ADMIN')")
public class PerguntaController {

    private final PerguntaService perguntaService;

    public PerguntaController(PerguntaService perguntaService) {
        this.perguntaService = perguntaService;
    }

    @PostMapping("/subgrupo/{subgrupoId}/pergunta")
    @ResponseStatus(HttpStatus.CREATED)
    public PerguntaResponse cadastrar(@PathVariable Long subgrupoId, @RequestBody @Valid PerguntaRequest request){
        return perguntaService.cadastrar(subgrupoId, request);
    }

    @PutMapping("/pergunta/{id}")
    public PerguntaResponse atualizar(@PathVariable Long id, @RequestBody @Valid PerguntaRequest request){
        return perguntaService.atualizar(id, request);
    }

    @DeleteMapping("/pergunta/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id){
        perguntaService.excluir(id);
    }
}
