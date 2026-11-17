package com.impulso.clientes;

import com.impulso.config.ImportadorGeografia;
import com.impulso.dto.AdminRequest;
import com.impulso.dto.AtualizarUsuarioRequest;
import com.impulso.dto.EmpresaRequest;
import com.impulso.model.Usuario;
import com.impulso.repository.UsuarioRepository;
import com.impulso.service.EmpresaService;
import com.impulso.service.UsuarioService;
import com.impulso.utils.NormalizadorEmail;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

// Cadastro de cliente novo pela linha de comando. O backend sobe, faz o cadastro e termina:
//
//   --novo-cliente --codigo=escola-abc --nome="Escola ABC" --cnpj=11222333000181 --admin-email=dono@escolaabc.com.br
//     cria o banco do cliente, monta a estrutura, importa a geografia, cria a empresa e o
//     primeiro admin (com uma senha provisória mostrada uma vez só, para trocar no primeiro acesso).
//
//   --novo-cliente --codigo=escola-abc --nome="Escola ABC" --banco-existente=impulso
//     adota um banco que já existe (com empresa e usuários): marca a estrutura como versão 1
//     e coloca os e-mails dele na lista central de logins.
//
//   --redefinir-senha --email=dono@escolaabc.com.br
//     gera uma senha provisória nova para um acesso que já existe (para quem esqueceu a senha
//     e não tem outro admin que possa trocá-la pela tela Usuários).
@Component
public class ComandoCliente implements ApplicationRunner {

    public static final String OPCAO = "novo-cliente";
    public static final String OPCAO_SENHA = "redefinir-senha";

    private final ApplicationContext contexto;
    private final CatalogoClientes catalogo;
    private final DiretorioLogins diretorio;
    private final MigradorBancos migrador;
    private final ConexaoBancos conexao;
    private final JdbcClient central;
    private final ImportadorGeografia importadorGeografia;
    private final EmpresaService empresaService;
    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;

    public ComandoCliente(ApplicationContext contexto, CatalogoClientes catalogo, DiretorioLogins diretorio,
                          MigradorBancos migrador, ConexaoBancos conexao, @Qualifier("centralJdbc") JdbcClient central,
                          ImportadorGeografia importadorGeografia, EmpresaService empresaService,
                          UsuarioService usuarioService, UsuarioRepository usuarioRepository) {
        this.contexto = contexto;
        this.catalogo = catalogo;
        this.diretorio = diretorio;
        this.migrador = migrador;
        this.conexao = conexao;
        this.central = central;
        this.importadorGeografia = importadorGeografia;
        this.empresaService = empresaService;
        this.usuarioService = usuarioService;
        this.usuarioRepository = usuarioRepository;
    }

    public static boolean foiPedido(String... args){
        List<String> lista = Arrays.asList(args);
        return lista.contains("--" + OPCAO) || lista.contains("--" + OPCAO_SENHA);
    }

    @Override
    public void run(ApplicationArguments args){
        if(args.containsOption(OPCAO_SENHA)){
            executarETerminar(() -> redefinirSenha(args), "Senha NÃO redefinida: ");
        } else if(args.containsOption(OPCAO)){
            executarETerminar(() -> {
                String bancoExistente = opcao(args, "banco-existente", false);
                if(bancoExistente == null){
                    criarClienteNovo(args);
                } else {
                    adotarBancoExistente(args, bancoExistente);
                }
            }, "Cliente NÃO cadastrado: ");
        }
    }

    // Roda o comando, mostra o erro (se houver) e encerra o backend.
    private void executarETerminar(Runnable comando, String avisoDeErro){
        int saida = 0;
        try {
            comando.run();
        } catch (RuntimeException e) {
            System.err.println();
            System.err.println(avisoDeErro + e.getMessage());
            saida = 1;
        }
        int codigoSaida = saida;
        System.exit(SpringApplication.exit(contexto, () -> codigoSaida));
    }

    private void redefinirSenha(ApplicationArguments args){
        String email = NormalizadorEmail.normalizar(opcao(args, "email", true));
        Long clienteId = diretorio.clienteDoEmail(email).orElseThrow(() -> new IllegalArgumentException(
                "O e-mail " + email + " não é login de nenhum cliente (o banco dele já foi adotado?)."));
        Cliente cliente = catalogo.buscarPorId(clienteId).orElseThrow();
        Usuario usuario = ClienteAtual.executar(clienteId, () -> usuarioRepository.findByEmailIgnoreCase(email).orElseThrow(
                () -> new IllegalArgumentException("O e-mail " + email + " está na lista central, mas não no banco do cliente.")));

        String senha = senhaProvisoria();
        // O mesmo caminho da tela Usuários: a senha nova também derruba os tokens antigos desse acesso.
        ClienteAtual.executar(clienteId, () -> usuarioService.atualizar(usuario.getId(), new AtualizarUsuarioRequest(usuario.getEmail(), senha)));

        System.out.println();
        System.out.println("Senha redefinida: " + email + " (cliente " + cliente.nome() + ")");
        System.out.println("Senha provisória: " + senha + "   (mostrada só agora; troque no primeiro acesso)");
        if(!usuario.isStAtivo()){
            System.out.println("Atenção: este acesso está bloqueado. Outro admin precisa desbloquear em Usuários.");
        }
    }

    private void criarClienteNovo(ApplicationArguments args){
        String codigo = validarCodigo(opcao(args, "codigo", true));
        String nome = opcao(args, "nome", true);
        String cnpj = opcao(args, "cnpj", true).replaceAll("\\D", "");
        String emailAdmin = NormalizadorEmail.normalizar(opcao(args, "admin-email", true));
        if(cnpj.length() != 14){
            throw new IllegalArgumentException("O CNPJ deve ter 14 dígitos.");
        }
        if(diretorio.existe(emailAdmin)){
            throw new IllegalArgumentException("O e-mail " + emailAdmin + " já é login de outro cliente.");
        }
        String banco = conexao.bancoDoCodigo(codigo);
        validarCodigoEBancoLivres(codigo, banco);

        Cliente cliente = catalogo.inserir(codigo, nome, banco);
        boolean bancoCriado = false;
        try {
            central.sql("CREATE DATABASE \"" + banco + "\"").update();
            bancoCriado = true;
            migrador.migrarCliente(cliente);

            String senha = senhaProvisoria();
            boolean geografia = ClienteAtual.executar(cliente.id(), importadorGeografia::importarSeVazio);
            ClienteAtual.executar(cliente.id(), () -> empresaService.salvar(new EmpresaRequest(nome, cnpj)));
            ClienteAtual.executar(cliente.id(), () -> usuarioService.cadastrarAdmin(new AdminRequest(emailAdmin, senha)));

            System.out.println();
            System.out.println("Cliente cadastrado: " + nome + " (código " + codigo + ", banco " + banco + ")");
            System.out.println("Primeiro admin: " + emailAdmin);
            System.out.println("Senha provisória: " + senha + "   (mostrada só agora; troque no primeiro acesso)");
            if(!geografia){
                System.out.println("A geografia do IBGE não veio agora; ela será importada na próxima subida do backend.");
            }
        } catch (RuntimeException e) {
            diretorio.remover(emailAdmin);
            if(bancoCriado){
                central.sql("DROP DATABASE IF EXISTS \"" + banco + "\" WITH (FORCE)").update();
            }
            catalogo.excluir(cliente.id());
            throw e;
        }
    }

    private void adotarBancoExistente(ApplicationArguments args, String banco){
        String codigo = validarCodigo(opcao(args, "codigo", true));
        String nome = opcao(args, "nome", true);
        boolean existe = central.sql("select count(*) from pg_database where datname = ?")
                .param(banco).query(Long.class).single() > 0;
        if(!existe){
            throw new IllegalArgumentException("O banco " + banco + " não existe.");
        }
        validarCodigoEBancoLivres(codigo, banco);

        Cliente cliente = catalogo.inserir(codigo, nome, banco);
        List<String> registrados = new ArrayList<>();
        try {
            migrador.migrarCliente(cliente);
            List<Usuario> usuarios = ClienteAtual.executar(cliente.id(), () -> usuarioRepository.findAll());
            for(Usuario usuario : usuarios){
                String email = NormalizadorEmail.normalizar(usuario.getEmail());
                if(diretorio.existe(email)){
                    throw new IllegalArgumentException("O e-mail " + email + " já é login de outro cliente.");
                }
                diretorio.registrar(email, cliente.id());
                registrados.add(email);
            }
            System.out.println();
            System.out.println("Banco adotado: " + banco + " agora é o cliente " + nome + " (código " + codigo + ")");
            System.out.println(registrados.size() + " login(s) colocados na lista central.");
        } catch (RuntimeException e) {
            registrados.forEach(diretorio::remover);
            catalogo.excluir(cliente.id());
            throw e;
        }
    }

    private void validarCodigoEBancoLivres(String codigo, String banco){
        if(catalogo.buscarPorCodigo(codigo).isPresent()){
            throw new IllegalArgumentException("Já existe um cliente com o código " + codigo + ".");
        }
        if(catalogo.bancoEmUso(banco)){
            throw new IllegalArgumentException("O banco " + banco + " já é de outro cliente.");
        }
    }

    // Letras minúsculas, números e hífen: o código vira parte do nome do banco.
    private static String validarCodigo(String codigo){
        if(!codigo.matches("[a-z0-9]+(-[a-z0-9]+)*") || codigo.length() < 3 || codigo.length() > 30){
            throw new IllegalArgumentException("Código inválido: use de 3 a 30 letras minúsculas, números e hífen (ex.: escola-abc).");
        }
        return codigo;
    }

    private static String opcao(ApplicationArguments args, String nome, boolean obrigatoria){
        List<String> valores = args.getOptionValues(nome);
        String valor = (valores == null || valores.isEmpty()) ? null : valores.get(0).trim();
        if(obrigatoria && (valor == null || valor.isEmpty())){
            throw new IllegalArgumentException("Falta a opção --" + nome + "=...");
        }
        return valor;
    }

    private static String senhaProvisoria(){
        byte[] bytes = new byte[9];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
