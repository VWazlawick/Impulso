package com.impulso.controller;

import com.impulso.dto.CepResponse;
import com.impulso.service.CepService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cep")
@PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
public class CepController {

    private final CepService cepService;

    public CepController(CepService cepService) {
        this.cepService = cepService;
    }

    @GetMapping("/{cep}")
    public CepResponse buscar(@PathVariable String cep){
        return cepService.buscar(cep);
    }
}
