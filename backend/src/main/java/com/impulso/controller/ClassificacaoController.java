package com.impulso.controller;

import com.impulso.dto.ClassificacaoRequest;
import com.impulso.dto.ClassificacaoResponse;
import com.impulso.enums.TipoIndicadorEnum;
import com.impulso.model.Classificacao;
import com.impulso.service.ClassificacaoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classificacao")
@PreAuthorize("hasRole('ADMIN')")
public class ClassificacaoController {

    private final ClassificacaoService classificacaoService;

    public ClassificacaoController(ClassificacaoService classificacaoService) {
        this.classificacaoService = classificacaoService;
    }

    @GetMapping
    public List<ClassificacaoResponse> listar(@RequestParam TipoIndicadorEnum tpIndicador, @RequestParam(required = false) Long subgrupoId){
        return classificacaoService.listar(tpIndicador, subgrupoId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClassificacaoResponse cadastrar(@RequestBody @Valid ClassificacaoRequest request){
        return classificacaoService.cadastrar(request);
    }

    @PutMapping("/{id}")
    public ClassificacaoResponse atualizar(@PathVariable Long id, @RequestBody @Valid ClassificacaoRequest request){
        return classificacaoService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id){
        classificacaoService.excluir(id);
    }
}
