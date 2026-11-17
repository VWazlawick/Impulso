package com.impulso.clientes;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.simple.JdbcClient;

import javax.sql.DataSource;

// As duas conexões do backend: o banco central (lista de clientes e de logins) e o
// BancoDosClientes, que é o que o JPA usa e leva cada pedido ao banco do seu cliente.
@Configuration
public class ConfiguracaoBancos {

    @Bean(destroyMethod = "close")
    public HikariDataSource bancoCentral(ConexaoBancos conexao){
        return conexao.novoPool("central", conexao.bancoCentral(), 3);
    }

    @Bean
    public JdbcClient centralJdbc(@Qualifier("bancoCentral") DataSource bancoCentral){
        return JdbcClient.create(bancoCentral);
    }

    @Bean
    @Primary
    public DataSource dataSource(CatalogoClientes catalogo, ConexaoBancos conexao){
        return new BancoDosClientes(catalogo, conexao);
    }
}
