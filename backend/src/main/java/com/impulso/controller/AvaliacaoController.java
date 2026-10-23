package com.impulso.controller;

import com.impulso.dto.AvaliacaoListaResponse;
import com.impulso.dto.AvaliacaoRequest;
import com.impulso.dto.AvaliacaoResponse;
import com.impulso.dto.FichaResponse;
import com.impulso.security.UsuarioLogado;
import com.impulso.service.AvaliacaoService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/aluno/{alunoId}/avaliacao")
@PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
public class AvaliacaoController {

    private final AvaliacaoService avaliacaoService;

    public AvaliacaoController(AvaliacaoService avaliacaoService) {
        this.avaliacaoService = avaliacaoService;
    }

    @GetMapping("/ficha")
    public FichaResponse ficha(@PathVariable Long alunoId, @RequestParam(required = false)
                               @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dtAvaliacao,
                               @AuthenticationPrincipal Jwt jwt){
        return avaliacaoService.ficha(alunoId, dtAvaliacao, UsuarioLogado.solicitante(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AvaliacaoResponse registrar(@PathVariable Long alunoId, @RequestBody @Valid AvaliacaoRequest request,
                                       @AuthenticationPrincipal Jwt jwt){
        return avaliacaoService.registrar(alunoId, request, UsuarioLogado.solicitante(jwt));
    }

    @GetMapping
    public List<AvaliacaoListaResponse> listar(@PathVariable Long alunoId, @AuthenticationPrincipal Jwt jwt){
        return avaliacaoService.listar(alunoId, UsuarioLogado.solicitante(jwt));
    }

    @GetMapping("/{id}")
    public AvaliacaoResponse buscarPorId(@PathVariable Long alunoId, @PathVariable Long id, @AuthenticationPrincipal Jwt jwt){
        return avaliacaoService.buscarPorId(alunoId, id, UsuarioLogado.solicitante(jwt));
    }

    @PutMapping("/{id}")
    public AvaliacaoResponse atualizar(@PathVariable Long alunoId, @PathVariable Long id,
                                       @RequestBody @Valid AvaliacaoRequest request, @AuthenticationPrincipal Jwt jwt){
        return avaliacaoService.atualizar(alunoId, id, request, UsuarioLogado.solicitante(jwt));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long alunoId, @PathVariable Long id, @AuthenticationPrincipal Jwt jwt){
        avaliacaoService.excluir(alunoId, id, UsuarioLogado.solicitante(jwt));
    }
}
