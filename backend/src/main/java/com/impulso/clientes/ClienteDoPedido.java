package com.impulso.clientes;

import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.text.ParseException;

// Primeiro filtro de cada pedido: lê no token o número do cliente e guarda no ClienteAtual,
// para que tudo o que vier depois use o banco certo. Aqui o token só é lido; a assinatura é
// conferida logo em seguida pelo Spring Security, antes de qualquer acesso ao banco, então um
// token com o cliente trocado é recusado sem ler nada.
public class ClienteDoPedido extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            ClienteAtual.definir(clienteDoToken(request.getHeader(HttpHeaders.AUTHORIZATION)));
            chain.doFilter(request, response);
        } finally {
            ClienteAtual.limpar();
        }
    }

    private static Long clienteDoToken(String cabecalho){
        if(cabecalho == null || !cabecalho.startsWith("Bearer ")){
            return null;
        }
        try {
            Object cliente = SignedJWT.parse(cabecalho.substring(7)).getJWTClaimsSet().getClaim("cliente");
            return cliente instanceof Number numero ? numero.longValue() : null;
        } catch (ParseException e) {
            return null;
        }
    }
}
