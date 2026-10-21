package com.impulso.controller;

import com.impulso.dto.GrupoDetalheResponse;
import com.impulso.dto.GrupoRequest;
import com.impulso.dto.GrupoResponse;
import com.impulso.service.GrupoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grupo")
@PreAuthorize("hasRole('ADMIN')")
public class GrupoController {

    private final GrupoService grupoService;

    public GrupoController(GrupoService grupoService) {
        this.grupoService = grupoService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    public List<GrupoResponse> listar(){
        return grupoService.listar();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    public GrupoDetalheResponse buscarPorId(@PathVariable Long id){
        return grupoService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GrupoResponse cadastrar(@RequestBody @Valid GrupoRequest request){
        return grupoService.cadastrar(request);
    }

    @PutMapping("/{id}")
    public GrupoResponse atualizar(@PathVariable Long id, @RequestBody @Valid GrupoRequest request){
        return grupoService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id){
        grupoService.excluir(id);
    }




}
