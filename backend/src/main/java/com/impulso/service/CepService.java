package com.impulso.service;

import com.impulso.dto.CepResponse;
import com.impulso.exception.RecursoNaoEncontradoException;
import com.impulso.exception.RequisicaoInvalidaException;
import com.impulso.exception.ServicoIndisponivelException;
import com.impulso.integracao.ViaCepClient;
import com.impulso.integracao.ViaCepEndereco;
import com.impulso.model.Cidade;
import com.impulso.repository.CidadeRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;

@Service
public class CepService {

    private final ViaCepClient viaCepClient;
    private final CidadeRepository cidadeRepository;

    public CepService(ViaCepClient viaCepClient, CidadeRepository cidadeRepository) {
        this.viaCepClient = viaCepClient;
        this.cidadeRepository = cidadeRepository;
    }

    public CepResponse buscar(String cep){
        if(!cep.matches("\\d{8}")){
            throw  new RequisicaoInvalidaException("O CEP deve ter 8 dígitos!");
        }

        ViaCepEndereco endereco;
        try {
            endereco = viaCepClient.buscar(cep);
        }
        catch (RestClientException e){
            throw new ServicoIndisponivelException("Consulta de CEP indisponível no momento, Preencha o endereço manualmente!");
        }
        if(endereco == null || endereco.erro() != null){
            throw new RecursoNaoEncontradoException("CEP não encontrado!");
        }

        Cidade cidade = cidadeRepository.findByCdIbge(Long.valueOf(endereco.cdIbge()))
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cidade do CEP não encontrada!"));
        return CepResponse.de(cep, endereco, cidade);
    }
}
