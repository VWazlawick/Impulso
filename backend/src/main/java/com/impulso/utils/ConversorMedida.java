package com.impulso.utils;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class ConversorMedida {

    private static final BigDecimal LIMITE_METROS = new BigDecimal("3");
    private static final BigDecimal CEM = new BigDecimal("100");

    public ConversorMedida() {
    }

    public static BigDecimal paraCentimetros(BigDecimal valor){
        if(valor != null && valor.compareTo(LIMITE_METROS) < 0){
            return valor.multiply(CEM).setScale(2, RoundingMode.HALF_UP);
        }
        return valor;
    }
}
