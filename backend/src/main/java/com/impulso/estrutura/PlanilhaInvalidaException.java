package com.impulso.estrutura;

import java.util.List;

// A planilha de importação tem problemas: a lista traz todos de uma vez (aba e linha de cada um).
public class PlanilhaInvalidaException extends RuntimeException {

    private final List<String> erros;

    public PlanilhaInvalidaException(List<String> erros) {
        super(erros.size() + " problema(s) na planilha; nada foi gravado.");
        this.erros = List.copyOf(erros);
    }

    public List<String> getErros() {
        return erros;
    }
}
