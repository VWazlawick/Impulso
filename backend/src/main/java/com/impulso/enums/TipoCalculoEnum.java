package com.impulso.enums;

public enum TipoCalculoEnum {
    NENHUM,
    MAIOR_VALOR,
    MENOR_VALOR,
    ESTAGIO;


    public boolean aceita(TipoRespostaEnum tpResposta){
        return switch (this){
            case NENHUM -> true;
            case MAIOR_VALOR, MENOR_VALOR -> tpResposta == TipoRespostaEnum.NUMERO;
            case ESTAGIO -> tpResposta == TipoRespostaEnum.SIM_NAO_PARCIAL;
        };
    }

    public boolean resultadoNumerico(){
        return this == MAIOR_VALOR || this == MENOR_VALOR;
    }
}
