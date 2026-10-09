package com.impulso.controller;

import com.impulso.dto.CidadeResponse;
import com.impulso.dto.EstadoResponse;
import com.impulso.dto.PaisResponse;
import com.impulso.service.GeografiaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class GeografiaController {

    private final GeografiaService geografiaService;

    public GeografiaController(GeografiaService geografiaService) {
        this.geografiaService = geografiaService;
    }

    @GetMapping("/paises")
    public List<PaisResponse> listarPaises(){
        return geografiaService.listarPaises();
    }

    @GetMapping("/estados")
    public List<EstadoResponse> listarEstados(@RequestParam Long paisId){
        return geografiaService.listarEstados(paisId);
    }

    @GetMapping("/cidades")
    public List<CidadeResponse> listarCidades(@RequestParam Long estadoId){
        return geografiaService.listarCidades(estadoId);
    }
}
