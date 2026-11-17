package com.impulso.clientes;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

// Mantém a estrutura de todos os bancos em dia com o Flyway. Roda quando o backend sobe,
// antes de ele começar a atender: primeiro o banco central (db/central), depois o banco de
// cada cliente ativo (db/migration). Cada banco guarda na tabela flyway_schema_history o que
// já recebeu, e só os arquivos que faltam são aplicados.
@Component
public class MigradorBancos implements InitializingBean {

    private static final Logger log = LoggerFactory.getLogger(MigradorBancos.class);

    private final DataSource bancoCentral;
    private final CatalogoClientes catalogo;
    private final ConexaoBancos conexao;

    public MigradorBancos(@Qualifier("bancoCentral") DataSource bancoCentral, CatalogoClientes catalogo,
                          ConexaoBancos conexao) {
        this.bancoCentral = bancoCentral;
        this.catalogo = catalogo;
        this.conexao = conexao;
    }

    @Override
    public void afterPropertiesSet(){
        Flyway.configure()
                .dataSource(bancoCentral)
                .locations("classpath:db/central")
                .load()
                .migrate();

        for(Cliente cliente : catalogo.listarAtivos()){
            migrarCliente(cliente);
        }
    }

    // baselineOnMigrate: um banco que já tinha a estrutura antes do Flyway (como o "impulso" de
    // desenvolvimento) é marcado como versão 1 sem rodar o V1 de novo. Banco novo, vazio, recebe tudo.
    public void migrarCliente(Cliente cliente){
        var resultado = Flyway.configure()
                .dataSource(conexao.url(cliente.banco()), conexao.usuario(), conexao.senha())
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("1")
                .load()
                .migrate();
        if(resultado.migrationsExecuted > 0){
            log.info("Banco do cliente {} atualizado: {} mudança(s) aplicada(s)", cliente.codigo(), resultado.migrationsExecuted);
        }
    }
}
