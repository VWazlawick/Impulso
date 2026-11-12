package com.impulso.security;

import com.impulso.exception.LoginBloqueadoException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// Conta as senhas erradas de cada e-mail. Depois de várias seguidas, o login desse e-mail fica
// travado por alguns minutos, mesmo com a senha certa: assim ninguém consegue testar senhas sem parar.
// A contagem fica na memória do backend; reiniciar o backend zera tudo.
@Component
public class TentativasLogin {

    private final int maxTentativas;
    private final Duration bloqueio;
    private final Map<String, Registro> registros = new ConcurrentHashMap<>();

    public TentativasLogin(@Value("${app.login.max-tentativas}") int maxTentativas,
                           @Value("${app.login.bloqueio-minutos}") long bloqueioMinutos) {
        this.maxTentativas = maxTentativas;
        this.bloqueio = Duration.ofMinutes(bloqueioMinutos);
    }

    // falhas: quantas seguidas; inicio: quando foi a primeira; bloqueadoAte: preenchido quando trava.
    private record Registro(int falhas, Instant inicio, Instant bloqueadoAte) {

        // Um registro vence quando o bloqueio acaba ou, sem bloqueio, quando a primeira falha fica velha.
        boolean venceu(Instant agora, Duration bloqueio){
            return bloqueadoAte != null ? agora.isAfter(bloqueadoAte) : agora.isAfter(inicio.plus(bloqueio));
        }
    }

    public void verificar(String email){
        Registro registro = registros.get(email);
        Instant agora = Instant.now();
        if(registro != null && registro.bloqueadoAte() != null && agora.isBefore(registro.bloqueadoAte())){
            long minutos = Duration.between(agora, registro.bloqueadoAte()).toMinutes() + 1;
            throw new LoginBloqueadoException("Muitas tentativas erradas. Tente de novo em " + minutos + " minuto(s)!");
        }
    }

    public void registrarFalha(String email){
        Instant agora = Instant.now();
        registros.compute(email, (chave, atual) -> {
            int falhas = (atual == null || atual.venceu(agora, bloqueio)) ? 1 : atual.falhas() + 1;
            Instant inicio = falhas == 1 ? agora : atual.inicio();
            return new Registro(falhas, inicio, falhas >= maxTentativas ? agora.plus(bloqueio) : null);
        });
        if(registros.size() > 1000){
            registros.values().removeIf(registro -> registro.venceu(agora, bloqueio));
        }
    }

    public void limpar(String email){
        registros.remove(email);
    }
}
