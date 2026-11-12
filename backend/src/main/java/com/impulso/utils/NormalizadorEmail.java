package com.impulso.utils;

import java.util.Locale;

// O e-mail de login é guardado e procurado sempre do mesmo jeito: sem espaços nas pontas e
// em minúsculas. Assim "Ana@Escola.com" e "ana@escola.com" são o mesmo acesso.
public class NormalizadorEmail {

    public NormalizadorEmail() {
    }

    public static String normalizar(String email){
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
