package com.impulso.controller;

import com.impulso.dto.EnderecoRequest;
import com.impulso.dto.EnderecoResponse;
import com.impulso.security.UsuarioLogado;
import com.impulso.service.EnderecoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/aluno/{alunoId}/endereco")
@PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
public class EnderecoController {

    private final EnderecoService enderecoService;

    public EnderecoController(EnderecoService enderecoService) {
        this.enderecoService = enderecoService;
    }

    @GetMapping
    public List<EnderecoResponse> listar(@PathVariable Long alunoId, @AuthenticationPrincipal Jwt jwt){
        return enderecoService.listar(alunoId, UsuarioLogado.solicitante(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EnderecoResponse cadastrar(@PathVariable Long alunoId, @RequestBody @Valid EnderecoRequest request,
                                      @AuthenticationPrincipal Jwt jwt){
        return enderecoService.cadastrar(alunoId, request, UsuarioLogado.solicitante(jwt));
    }

    @PutMapping("/{id}")
    public EnderecoResponse atualizar(@PathVariable Long alunoId, @PathVariable Long id,
                                      @RequestBody @Valid EnderecoRequest request, @AuthenticationPrincipal Jwt jwt){
        return enderecoService.atualizar(alunoId, id, request, UsuarioLogado.solicitante(jwt));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long alunoId, @PathVariable Long id,
                                    @AuthenticationPrincipal Jwt jwt){
        enderecoService.excluir(alunoId, id, UsuarioLogado.solicitante(jwt));
    }
}
