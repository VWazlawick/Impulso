package com.impulso.clientes;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.jdbc.datasource.AbstractDataSource;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// A conexão que o JPA usa. Não é um banco só: a cada pedido de conexão ela olha o ClienteAtual
// e entrega uma conexão do banco daquele cliente. Cada cliente ganha seu próprio grupo de
// conexões (pool), criado na primeira vez que for usado.
public class BancoDosClientes extends AbstractDataSource implements DisposableBean {

    private final CatalogoClientes catalogo;
    private final ConexaoBancos conexao;
    private final Map<Long, HikariDataSource> pools = new ConcurrentHashMap<>();

    public BancoDosClientes(CatalogoClientes catalogo, ConexaoBancos conexao) {
        this.catalogo = catalogo;
        this.conexao = conexao;
    }

    @Override
    public Connection getConnection() throws SQLException {
        return poolDoClienteAtual().getConnection();
    }

    @Override
    public Connection getConnection(String usuario, String senha) throws SQLException {
        return poolDoClienteAtual().getConnection(usuario, senha);
    }

    private HikariDataSource poolDoClienteAtual(){
        Long id = ClienteAtual.id();
        if(id == null){
            throw new IllegalStateException("Acesso ao banco sem cliente definido");
        }
        return pools.computeIfAbsent(id, this::criarPool);
    }

    private HikariDataSource criarPool(Long id){
        Cliente cliente = catalogo.buscarPorId(id)
                .orElseThrow(() -> new IllegalStateException("Cliente " + id + " não está no banco central"));
        return conexao.novoPool("cliente-" + cliente.codigo(), cliente.banco(), conexao.conexoesPorCliente());
    }

    @Override
    public void destroy(){
        pools.values().forEach(HikariDataSource::close);
    }
}
