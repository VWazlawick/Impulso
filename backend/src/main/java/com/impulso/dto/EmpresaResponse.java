package com.impulso.dto;

import com.impulso.model.Empresa;

public record EmpresaResponse(Long id, String razaoSocial, String cnpj) {

    public static EmpresaResponse de(Empresa empresa){
        return new EmpresaResponse(empresa.getId(), empresa.getRazaoSocial(), empresa.getCnpj());
    }
}
