package com.impulso;

import com.impulso.clientes.ComandoCliente;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ImpulsoApplication {

	public static void main(String[] args) {
		// Nos comandos (cliente novo, nova senha) o backend sobe numa porta livre qualquer (para não
		// brigar com o backend que já estiver rodando na 8080), faz o serviço e termina. Propriedade
		// do sistema, porque ela ganha do server.port do application.properties.
		if (ComandoCliente.foiPedido(args)) {
			System.setProperty("server.port", "0");
		}
		SpringApplication.run(ImpulsoApplication.class, args);
	}

}
