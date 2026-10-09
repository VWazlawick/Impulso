package com.impulso.controller;

import com.impulso.dto.EmpresaRequest;
import com.impulso.dto.EmpresaResponse;
import com.impulso.service.EmpresaService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/empresa")
public class EmpresaController {

    private final EmpresaService empresaService;

    public EmpresaController(EmpresaService empresaService) {
        this.empresaService = empresaService;
    }

    @GetMapping("/atual")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    public EmpresaResponse consultar(){
        return empresaService.consultar();
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public EmpresaResponse salvar(@RequestBody @Valid EmpresaRequest request){
        return empresaService.salvar(request);
    }
}
