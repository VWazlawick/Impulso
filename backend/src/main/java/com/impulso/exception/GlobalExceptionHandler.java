package com.impulso.exception;

import com.impulso.dto.ErroResponse;
import com.impulso.dto.ErroValidacaoResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;

import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.nio.file.AccessDeniedException;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErroResponse> credenciaisInvalidas(AuthenticationException e){
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErroResponse("Credenciais inválidas"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErroResponse> acessoNegado(AccessDeniedException e){
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErroResponse("Acesso Negado"));
    }

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<ErroResponse> naoEncontrado(RecursoNaoEncontradoException e){
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErroResponse(e.getMessage()));
    }

    @ExceptionHandler(ConflitoException.class)
    public ResponseEntity<ErroResponse> conflito(ConflitoException e){
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErroResponse(e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroValidacaoResponse> dadosInvalidos(MethodArgumentNotValidException e){
        Map<String, String> campos = new LinkedHashMap<>();
        for(FieldError erro : e.getBindingResult().getFieldErrors()){
            campos.put(erro.getField(), erro.getDefaultMessage());
        }
        return ResponseEntity.badRequest().body(new ErroValidacaoResponse("Dados Inválidos", campos));
    }
}
