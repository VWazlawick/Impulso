package com.impulso.clientes;

import com.impulso.exception.ConflitoException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Optional;

// A lista central "e-mail de login → cliente". É por ela que o login descobre o banco
// de quem está entrando, e é ela que garante o e-mail único no sistema inteiro.
// Os e-mails chegam já normalizados (minúsculas, sem espaços).
@Component
public class DiretorioLogins {

    private final JdbcClient central;

    public DiretorioLogins(@Qualifier("centralJdbc") JdbcClient central) {
        this.central = central;
    }

    public Optional<Long> clienteDoEmail(String email){
        return central.sql("select cliente_id from login where email = ?").param(email).query(Long.class).optional();
    }

    public boolean existe(String email){
        return clienteDoEmail(email).isPresent();
    }

    public void registrar(String email, Long clienteId){
        try {
            central.sql("insert into login (email, cliente_id) values (?, ?)").params(email, clienteId).update();
        } catch (DuplicateKeyException e) {
            throw new ConflitoException("Email já cadastrado!");
        }
        aoDesfazer(() -> remover(email));
    }

    public void trocar(String emailAntigo, String emailNovo){
        try {
            central.sql("update login set email = ? where email = ?").params(emailNovo, emailAntigo).update();
        } catch (DuplicateKeyException e) {
            throw new ConflitoException("Email já cadastrado!");
        }
        aoDesfazer(() -> central.sql("update login set email = ? where email = ?").params(emailAntigo, emailNovo).update());
    }

    public void remover(String email){
        central.sql("delete from login where email = ?").param(email).update();
    }

    // O usuário é gravado no banco do cliente, e o e-mail aqui no central: são dois bancos, sem
    // uma transação só. Se a gravação no banco do cliente não se confirmar, a mudança daqui é desfeita.
    private void aoDesfazer(Runnable desfazer){
        if(TransactionSynchronizationManager.isSynchronizationActive()){
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status){
                    if(status != STATUS_COMMITTED){
                        desfazer.run();
                    }
                }
            });
        }
    }
}
