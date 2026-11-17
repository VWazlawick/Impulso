package com.impulso;

import com.impulso.clientes.ComandoCliente;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.Map;

@SpringBootApplication
public class ImpulsoApplication {

	public static void main(String[] args) {
		SpringApplication app = new SpringApplication(ImpulsoApplication.class);
		// Nos comandos (cliente novo, nova senha) o backend sobe numa porta livre qualquer (para não
		// brigar com o backend que já estiver rodando na 8080), faz o serviço e termina.
		if (ComandoCliente.foiPedido(args)) {
			app.setDefaultProperties(Map.of("server.port", "0"));
		}
		app.run(args);
	}

}
