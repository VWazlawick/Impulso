package com.impulso.exception;

import com.impulso.dto.ErroResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErroResponse> credenciaisInvalidas(AuthenticationException e){
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErroResponse("Credenciais inválidas"));
    }
}
