package com.impulso.controller;

import com.impulso.dto.ResponsavelRequest;
import com.impulso.dto.ResponsavelResponse;
import com.impulso.service.ResponsavelService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responsavel")
@PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
public class ResponsavelController {

    private final ResponsavelService responsavelService;

    public ResponsavelController(ResponsavelService responsavelService) {
        this.responsavelService = responsavelService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponsavelResponse cadastrar(@RequestBody @Valid ResponsavelRequest request){
        return responsavelService.cadastrar(request);
    }

    @GetMapping
    public List<ResponsavelResponse> listar(@RequestParam(required = false) String nome){
        if(nome == null || nome.isBlank()){
            return responsavelService.listar();
        }

        return responsavelService.buscarPorNome(nome);
    }

    @GetMapping("/{id}")
    public ResponsavelResponse buscarPorId(@PathVariable Long id){
        return responsavelService.buscarPorId(id);
    }

    @PutMapping("/{id}")
    public ResponsavelResponse atualizar(@RequestBody @Valid ResponsavelRequest request, @PathVariable Long id){
        return responsavelService.atualizar(id, request);
    }
}
