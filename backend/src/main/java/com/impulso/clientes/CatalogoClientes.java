package com.impulso.clientes;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

// A lista de clientes no banco central.
@Component
public class CatalogoClientes {

    private static final String COLUNAS = "id, cd_cliente, nm_cliente, nm_banco, st_ativo";

    private final JdbcClient central;

    public CatalogoClientes(@Qualifier("centralJdbc") JdbcClient central) {
        this.central = central;
    }

    public Optional<Cliente> buscarPorId(Long id){
        return central.sql("select " + COLUNAS + " from cliente where id = ?")
                .param(id)
                .query(CatalogoClientes::paraCliente)
                .optional();
    }

    public Optional<Cliente> buscarPorCodigo(String codigo){
        return central.sql("select " + COLUNAS + " from cliente where cd_cliente = ?")
                .param(codigo)
                .query(CatalogoClientes::paraCliente)
                .optional();
    }

    public List<Cliente> listarAtivos(){
        return central.sql("select " + COLUNAS + " from cliente where st_ativo order by id")
                .query(CatalogoClientes::paraCliente)
                .list();
    }

    public boolean estaAtivo(Long id){
        return buscarPorId(id).map(Cliente::ativo).orElse(false);
    }

    public boolean bancoEmUso(String banco){
        return central.sql("select count(*) from cliente where nm_banco = ?").param(banco).query(Long.class).single() > 0;
    }

    public Cliente inserir(String codigo, String nome, String banco){
        KeyHolder chave = new GeneratedKeyHolder();
        central.sql("insert into cliente (cd_cliente, nm_cliente, nm_banco) values (?, ?, ?)")
                .params(codigo, nome, banco)
                .update(chave, "id");
        Long id = chave.getKeyAs(Long.class);
        return new Cliente(id, codigo, nome, banco, true);
    }

    public void excluir(Long id){
        central.sql("delete from cliente where id = ?").param(id).update();
    }

    private static Cliente paraCliente(java.sql.ResultSet linha, int numero) throws java.sql.SQLException {
        return new Cliente(linha.getLong("id"), linha.getString("cd_cliente"), linha.getString("nm_cliente"),
                linha.getString("nm_banco"), linha.getBoolean("st_ativo"));
    }
}
