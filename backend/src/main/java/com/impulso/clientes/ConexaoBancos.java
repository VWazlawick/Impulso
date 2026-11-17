package com.impulso.clientes;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

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

    public ConexaoBancos(@Value("${app.banco.url}") String url,
                         @Value("${app.banco.servidor}") String servidor,
                         @Value("${app.banco.parametros}") String parametros,
                         @Value("${app.banco.usuario}") String usuario,
                         @Value("${app.banco.senha}") String senha,
                         @Value("${app.banco.central}") String bancoCentral,
                         @Value("${app.banco.prefixo}") String prefixo,
                         @Value("${app.banco.conexoes-por-cliente}") int conexoesPorCliente) {
        if(url != null && !url.isBlank()){
            // Uma URL só, no formato do Neon e do Render: postgresql://usuario:senha@host/banco?parametros.
            // O banco que vem nela é ignorado: o Impulso usa o central e um banco por escola no mesmo servidor.
            URI uri = URI.create(url.strip().replaceAll("^[\"']|[\"']$", ""));
            String[] credenciais = uri.getRawUserInfo().split(":", 2);
            this.usuario = decodificar(credenciais[0]);
            this.senha = credenciais.length > 1 ? decodificar(credenciais[1]) : "";
            this.servidor = "jdbc:postgresql://" + uri.getHost() + (uri.getPort() > 0 ? ":" + uri.getPort() : "") + "/";
            this.parametros = uri.getRawQuery() == null ? "" : "?" + uri.getRawQuery();
        } else {
            this.servidor = servidor.endsWith("/") ? servidor : servidor + "/";
            this.parametros = parametros;
            this.usuario = usuario;
            this.senha = senha;
        }
        this.bancoCentral = bancoCentral;
        this.prefixo = prefixo;
        this.conexoesPorCliente = conexoesPorCliente;
    }

    private static String decodificar(String texto){
        return URLDecoder.decode(texto, StandardCharsets.UTF_8);
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
