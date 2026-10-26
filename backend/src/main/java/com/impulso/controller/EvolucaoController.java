package com.impulso.controller;

import com.impulso.dto.EvolucaoResponse;
import com.impulso.model.Usuario;
import com.impulso.security.UsuarioLogado;
import com.impulso.service.EvolucaoService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/aluno/{alunoId}/evolucao")
@PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL', 'RESPONSAVEL')")
public class EvolucaoController {

    private final EvolucaoService evolucaoService;

    public EvolucaoController(EvolucaoService evolucaoService) {
        this.evolucaoService = evolucaoService;
    }

    @GetMapping
    public EvolucaoResponse evolucao(@PathVariable Long alunoId, @AuthenticationPrincipal Jwt jwt){
        return evolucaoService.evolucao(alunoId, UsuarioLogado.solicitante(jwt));
    }
}
