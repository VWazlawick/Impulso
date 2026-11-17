package com.impulso.clientes;

// Uma escola ou academia que usa o Impulso, como está no banco central.
public record Cliente(Long id, String codigo, String nome, String banco, boolean ativo) {
}
