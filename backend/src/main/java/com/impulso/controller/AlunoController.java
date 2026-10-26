package com.impulso.controller;

import com.impulso.dto.*;
import com.impulso.security.UsuarioLogado;
import com.impulso.service.AlunoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/aluno")
@PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
public class AlunoController {

    private final AlunoService alunoService;

    public AlunoController(AlunoService alunoService) {
        this.alunoService = alunoService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AlunoResponse cadastrar(@RequestBody @Valid AlunoRequest request, @AuthenticationPrincipal Jwt jwt){
        return alunoService.cadastrar(request, UsuarioLogado.solicitante(jwt));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL', 'RESPONSAVEL')")
    public List<AlunoResponse> listar(@AuthenticationPrincipal Jwt jwt){
        return alunoService.listar(UsuarioLogado.solicitante(jwt));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL', 'RESPONSAVEL')")
    public AlunoResponse buscarPorId(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt){
        return alunoService.buscarPorId(id, UsuarioLogado.solicitante(jwt));
    }

    @PutMapping("/{id}")
    public AlunoResponse atualizar(@PathVariable Long id, @RequestBody @Valid AlunoRequest request,
                                   @AuthenticationPrincipal Jwt jwt){
        return alunoService.atualizarId(id, UsuarioLogado.solicitante(jwt), request);
    }

    @PatchMapping("/{id}/profissional")
    @PreAuthorize("hasRole('ADMIN')")
    public AlunoResponse transferir(@PathVariable Long id, @RequestBody @Valid TransferirAlunoRequest request){
        return alunoService.transferir(id, request);
    }

    @GetMapping("/{id}/responsaveis")
    public List<ResponsavelResponse> listarResponsaveis(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt){
        return alunoService.listarResponsaveis(id, UsuarioLogado.solicitante(jwt));
    }

    @PostMapping("/{id}/responsavel/{responsavelId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void vincularResponsar(@PathVariable Long id, @PathVariable Long responsavelId, @AuthenticationPrincipal Jwt jwt){
        alunoService.vincularResponsavel(id, responsavelId, UsuarioLogado.solicitante(jwt));
    }

    @DeleteMapping("/{id}/responsavel/{responsavelId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void desvincularResponsar(@PathVariable Long id, @PathVariable Long responsavelId, @AuthenticationPrincipal Jwt jwt){
        alunoService.desvincularResponsavel(id, responsavelId, UsuarioLogado.solicitante(jwt));
    }

    @PostMapping("/{id}/responsavel")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponsavelResponse cadastrarResponsavel(@PathVariable Long id, @RequestBody @Valid ResponsavelRequest request,
                                                    @AuthenticationPrincipal Jwt jwt){
        return alunoService.cadastrarResponsavel(id, request, UsuarioLogado.solicitante(jwt));
    }
}
