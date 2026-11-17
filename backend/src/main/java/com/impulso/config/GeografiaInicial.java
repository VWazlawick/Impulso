package com.impulso.config;

import com.impulso.clientes.CatalogoClientes;
import com.impulso.clientes.Cliente;
import com.impulso.clientes.ClienteAtual;
import com.impulso.clientes.ComandoCliente;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

// Na subida do backend, confere a geografia do IBGE no banco de cada cliente ativo. Normalmente
// ela já veio no cadastro do cliente; aqui só cobre o caso de o IBGE ter falhado naquela hora.
@Component
public class GeografiaInicial implements CommandLineRunner {

    private final CatalogoClientes catalogo;
    private final ImportadorGeografia importador;
    private final boolean importar;

    public GeografiaInicial(CatalogoClientes catalogo, ImportadorGeografia importador,
                            @Value("${app.ibge.importar}") boolean importar) {
        this.catalogo = catalogo;
        this.importador = importador;
        this.importar = importar;
    }

    @Override
    public void run(String... args){
        if(!importar || ComandoCliente.foiPedido(args)){
            return;
        }
        for(Cliente cliente : catalogo.listarAtivos()){
            ClienteAtual.executar(cliente.id(), importador::importarSeVazio);
        }
    }
}
