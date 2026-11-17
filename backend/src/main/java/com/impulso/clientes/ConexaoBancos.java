package com.impulso.clientes;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

// Os dados de conexão do servidor PostgreSQL. O banco central e os bancos dos clientes
// ficam no mesmo servidor, com o mesmo usuário: muda só o nome do banco no fim da URL
// (seguido dos parâmetros, como o ?sslmode=require que o Neon exige).
@Component
public class ConexaoBancos {

    private final String servidor;
    private final String parametros;
    private final String usuario;
    private final String senha;
    private final String bancoCentral;
    private final String prefixo;
    private final int conexoesPorCliente;

    public ConexaoBancos(@Value("${app.banco.servidor}") String servidor,
                         @Value("${app.banco.parametros}") String parametros,
                         @Value("${app.banco.usuario}") String usuario,
                         @Value("${app.banco.senha}") String senha,
                         @Value("${app.banco.central}") String bancoCentral,
                         @Value("${app.banco.prefixo}") String prefixo,
                         @Value("${app.banco.conexoes-por-cliente}") int conexoesPorCliente) {
        this.servidor = servidor.endsWith("/") ? servidor : servidor + "/";
        this.parametros = parametros;
        this.usuario = usuario;
        this.senha = senha;
        this.bancoCentral = bancoCentral;
        this.prefixo = prefixo;
        this.conexoesPorCliente = conexoesPorCliente;
    }

    public String url(String banco){
        return servidor + banco + parametros;
    }

    public String usuario(){
        return usuario;
    }

    public String senha(){
        return senha;
    }

    public String bancoCentral(){
        return bancoCentral;
    }

    // Nome do banco de um cliente novo: o prefixo mais o código, com "_" no lugar de "-".
    public String bancoDoCodigo(String codigo){
        return prefixo + codigo.replace('-', '_');
    }

    public int conexoesPorCliente(){
        return conexoesPorCliente;
    }

    public HikariDataSource novoPool(String nome, String banco, int maximoConexoes){
        HikariDataSource pool = new HikariDataSource();
        pool.setPoolName(nome);
        pool.setJdbcUrl(url(banco));
        pool.setUsername(usuario);
        pool.setPassword(senha);
        pool.setMaximumPoolSize(maximoConexoes);
        pool.setMinimumIdle(0);
        return pool;
    }
}
