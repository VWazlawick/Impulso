package com.impulso.clientes;

import java.util.function.Supplier;

// De qual cliente é o pedido que está sendo atendido agora. Cada pedido roda numa thread
// própria, então o valor fica guardado por thread (ThreadLocal). O BancoDosClientes lê
// daqui para saber em qual banco conectar.
public final class ClienteAtual {

    private static final ThreadLocal<Long> ATUAL = new ThreadLocal<>();

    private ClienteAtual() {
    }

    public static Long id(){
        return ATUAL.get();
    }

    public static void definir(Long clienteId){
        if(clienteId == null){
            ATUAL.remove();
        } else {
            ATUAL.set(clienteId);
        }
    }

    public static void limpar(){
        ATUAL.remove();
    }

    // Roda um trecho no banco de um cliente e depois volta ao cliente que estava antes
    // (usado no login, na subida do backend e no cadastro de cliente novo).
    public static <T> T executar(Long clienteId, Supplier<T> trecho){
        Long anterior = ATUAL.get();
        definir(clienteId);
        try {
            return trecho.get();
        } finally {
            definir(anterior);
        }
    }

    public static void executar(Long clienteId, Runnable trecho){
        executar(clienteId, () -> {
            trecho.run();
            return null;
        });
    }
}
