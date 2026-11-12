package com.impulso.exception;

public class LoginBloqueadoException extends RuntimeException{

    public LoginBloqueadoException(String mensagem){
        super(mensagem);
    }
}
