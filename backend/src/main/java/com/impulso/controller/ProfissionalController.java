package com.impulso.controller;

import com.impulso.dto.ProfissionalRequest;
import com.impulso.dto.ProfissionalResponse;
import com.impulso.service.ProfissionalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profissional")
@PreAuthorize("hasRole('ADMIN')")
public class ProfissionalController {

    private final ProfissionalService profissionalService;

    public ProfissionalController(ProfissionalService profissionalService) {
        this.profissionalService = profissionalService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProfissionalResponse cadastrar(@RequestBody @Valid ProfissionalRequest request){
        return profissionalService.cadastrar(request);
    }

    @GetMapping
    public List<ProfissionalResponse> listar(){
        return profissionalService.listar();
    }

    @GetMapping("/{id}")
    public ProfissionalResponse buscarPorId(@PathVariable Long id){
        return profissionalService.buscarPorId(id);
    }

    @PutMapping("/{id}")
    public ProfissionalResponse atualizar(@PathVariable Long id, @RequestBody @Valid ProfissionalRequest request){
        return profissionalService.atualizar(id, request);
    }
}
