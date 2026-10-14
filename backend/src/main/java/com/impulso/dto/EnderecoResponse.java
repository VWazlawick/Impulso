package com.impulso.dto;

import com.impulso.model.Cidade;
import com.impulso.model.Endereco;

public record EnderecoResponse(Long id, String rua, String nrCasa, String bairro, String cep, String complemento,
                               Long cidadeId, String nmCidade, String sgEstado) {

    public static EnderecoResponse de(Endereco endereco){
        Cidade cidade = endereco.getCidade();

        return new EnderecoResponse(endereco.getId(), endereco.getRua(), endereco.getNrCasa(), endereco.getBairro(),
                endereco.getCep(), endereco.getComplemento(), cidade.getId(), cidade.getNmCidade(),
                cidade.getEstado().getSgEstado());
    }
}
