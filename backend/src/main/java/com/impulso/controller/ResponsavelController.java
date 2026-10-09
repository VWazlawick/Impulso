package com.impulso.controller;

import com.impulso.dto.ResponsavelRequest;
import com.impulso.dto.ResponsavelResponse;
import com.impulso.security.UsuarioLogado;
import com.impulso.service.ResponsavelService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
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

    @GetMapping
    public List<ResponsavelResponse> listar(@RequestParam(required = false) String nome, @AuthenticationPrincipal Jwt jwt){
        return responsavelService.listar(nome, UsuarioLogado.solicitante(jwt));
    }

    @GetMapping("/{id}")
    public ResponsavelResponse buscarPorId(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt){
        return responsavelService.buscarPorId(id, UsuarioLogado.solicitante(jwt));
    }

    @PutMapping("/{id}")
    public ResponsavelResponse atualizar(@RequestBody @Valid ResponsavelRequest request,
                                         @PathVariable Long id, @AuthenticationPrincipal Jwt jwt){
        return responsavelService.atualizar(id, request, UsuarioLogado.solicitante(jwt));
    }
}
