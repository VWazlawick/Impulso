package com.impulso.dto;

import com.impulso.integracao.ViaCepEndereco;
import com.impulso.model.Cidade;

public record CepResponse(String cep, String rua, String bairro, Long cidadeId, String nmCidade, String sgEstado) {

    public static CepResponse de(String cep, ViaCepEndereco endereco, Cidade cidade){
        return new CepResponse(cep, endereco.rua(), endereco.bairro(), cidade.getId(), cidade.getNmCidade(), cidade.getEstado().getSgEstado());
    }
}
