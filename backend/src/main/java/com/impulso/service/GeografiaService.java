package com.impulso.service;

import com.impulso.dto.CidadeResponse;
import com.impulso.dto.EstadoResponse;
import com.impulso.dto.PaisResponse;
import com.impulso.repository.CidadeRepository;
import com.impulso.repository.EstadoRepository;
import com.impulso.repository.PaisRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GeografiaService {

    private final PaisRepository paisRepository;
    private final EstadoRepository estadoRepository;
    private final CidadeRepository cidadeRepository;

    public GeografiaService(PaisRepository paisRepository, EstadoRepository estadoRepository, CidadeRepository cidadeRepository) {
        this.paisRepository = paisRepository;
        this.estadoRepository = estadoRepository;
        this.cidadeRepository = cidadeRepository;
    }

    @Transactional(readOnly = true)
    public List<PaisResponse> listarPaises(){
        return paisRepository.findAllByOrderByNmPaisAsc().stream().map(PaisResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public List<EstadoResponse> listarEstados(Long paisId){
        return estadoRepository.findByPaisIdOrderByNmEstadoAsc(paisId).stream().map(EstadoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public List<CidadeResponse> listarCidades(Long estadoId){
        return cidadeRepository.findByEstadoIdOrderByNmCidadeAsc(estadoId).stream().map(CidadeResponse::de).toList();
    }
}
