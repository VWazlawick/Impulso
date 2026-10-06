package com.impulso.service;

import com.impulso.dto.EmpresaRequest;
import com.impulso.dto.EmpresaResponse;
import com.impulso.exception.RecursoNaoEncontradoException;
import com.impulso.model.Empresa;
import com.impulso.repository.EmpresaRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class EmpresaService {

    private final EmpresaRepository empresaRepository;

    public EmpresaService(EmpresaRepository empresaRepository) {
        this.empresaRepository = empresaRepository;
    }

    public Empresa buscarEmpresaAtual(){
        return empresaRepository.findFirstByOrderByIdAsc().orElseThrow(() ->
                new RecursoNaoEncontradoException("A empresa ainda não foi Cadastrada"));
    }

    public EmpresaResponse consultar(){
        return EmpresaResponse.de(buscarEmpresaAtual());
    }

    @Transactional
    public EmpresaResponse salvar(EmpresaRequest request){
        Empresa empresa = empresaRepository.findFirstByOrderByIdAsc().orElseGet(Empresa::new);
        empresa.setRazaoSocial(request.razaoSocial());
        empresa.setCnpj(request.cnpj());
        return EmpresaResponse.de(empresaRepository.save(empresa));
    }
}
