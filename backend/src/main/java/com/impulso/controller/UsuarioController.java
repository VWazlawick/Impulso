package com.impulso.controller;

import com.impulso.dto.*;
import com.impulso.model.Usuario;
import com.impulso.security.UsuarioLogado;
import com.impulso.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuario")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFISSIONAL')")
    public UsuarioResponse cadastrar(@RequestBody @Valid UsuarioRequest request,
                                     @AuthenticationPrincipal Jwt jwt){
        return usuarioService.criarAcesso(request, UsuarioLogado.solicitante(jwt));
    }

    @GetMapping("/me")
    public UsuarioResponse meusDados(@AuthenticationPrincipal Jwt jwt){
        return usuarioService.buscarPorId(UsuarioLogado.id(jwt));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponse buscarPorId(@PathVariable Long id){
        return usuarioService.buscarPorId(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponse atualizar(@PathVariable Long id, @RequestBody @Valid AtualizarUsuarioRequest request){
        return usuarioService.atualizar(id, request);
    }

    @PatchMapping("/{id}/inativar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void inativar(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt){
        usuarioService.inativar(id, UsuarioLogado.id(jwt));
    }

    @PatchMapping("/{id}/reativar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void reativar(@PathVariable Long id){
        usuarioService.reativar(id);
    }

    @PostMapping("/admin")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponse cadastrarAdmin(@RequestBody @Valid AdminRequest request){
        return usuarioService.cadastrarAdmin(request);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UsuarioListaResponse> listar(){
        return usuarioService.listar();
    }

}
