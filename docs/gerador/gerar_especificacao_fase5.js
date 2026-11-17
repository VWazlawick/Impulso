// Uso: node gerar_especificacao_fase5.js [saida.docx]  (padrão: ../Especificacao_Detalhada_Fase5.docx)
// Os e-mails, códigos e nomes de escola deste documento são fictícios.
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { instance } = require("@viz-js/viz");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  AlignmentType, ShadingType, Table, TableRow, TableCell, WidthType, BorderStyle
} = require("docx");

const HEADER_BG = "1F3864";
const SAIDA = process.argv[2] || path.join(__dirname, "..", "Especificacao_Detalhada_Fase5.docx");

const blocos = [
  ["A", "Usuários e administradores", "O ADMIN vê todos os acessos numa lista e cadastra outros administradores. Ninguém bloqueia o próprio acesso, e sempre sobra um admin ativo.", "RF12, RF19"],
  ["B", "Segurança", "Bloquear um acesso ou trocar a senha tira a pessoa na hora; o login trava depois de várias senhas erradas; o e-mail não diferencia maiúsculas; perfil de produção.", "RNF09–RNF11"],
  ["C", "Vários clientes (Modelo 2)", "Um backend atende várias escolas, cada uma com o próprio banco. Todos entram pelo mesmo endereço, e o e-mail diz de qual escola é o login.", "RNF06, RF20"],
];

const seguranca = [
  ["Token rechecado a cada pedido", "Além da validade, o backend confere no banco se o usuário existe, está ativo, se o cliente dele está ativo e se a senha é a mesma de quando o token foi gerado (o token leva um carimbo da senha). Se algo mudou: 401.", "UsuarioAtivoValidator"],
  ["Validade do token", "8 horas; depois disso é preciso entrar de novo.", "app.jwt.expiration-ms"],
  ["Limite de tentativas", "5 senhas erradas seguidas travam o login daquele e-mail por 15 minutos, mesmo com a senha certa (429). Acertar zera a contagem. Vale também para e-mail que não existe.", "app.login.max-tentativas e app.login.bloqueio-minutos (TentativasLogin)"],
  ["Login sem pistas", "E-mail inexistente e senha errada dão a mesma resposta (401 \"Credenciais inválidas\") e levam o mesmo tempo, porque o login confere uma senha fictícia quando o e-mail não existe.", "AuthService"],
  ["E-mail sem maiúsculas", "O e-mail de login é guardado sem espaços e em minúsculas, e procurado sem diferenciar maiúsculas.", "NormalizadorEmail"],
  ["Perfil de produção", "Desliga o Swagger e o log de SQL. Liga com SPRING_PROFILES_ACTIVE=prod.", "application-prod.properties"],
  ["Fontes do próprio site", "As fontes vão junto com o frontend, então o navegador dos usuários não avisa o Google a cada acesso.", "frontend (@fontsource)"],
];

const regrasUsuarios = [
  ["Bloquear o próprio acesso", "Recusado: 409 \"Você não pode bloquear o próprio acesso!\". A tela nem mostra o botão no próprio acesso."],
  ["Bloquear o último admin ativo", "Recusado: 409. Cobre o caso de um admin já bloqueado que ainda tenha um token velho na mão."],
  ["E-mail repetido", "Recusado em qualquer cliente: 409 \"Email já cadastrado!\". Maiúsculas não contam como diferença."],
];

const rotas = [
  ["GET", "/api/usuario", "ADMIN", "Todos os acessos do cliente, com o nome da pessoa (admin não tem pessoa): id, email, tpUsuario, stAtivo, nmPessoa", "200"],
  ["POST", "/api/usuario/admin", "ADMIN", "Cadastra outro administrador (email, senha)", "201 / 400 / 409"],
  ["PATCH", "/api/usuario/{id}/inativar", "ADMIN", "Bloqueia o acesso; passa a recusar o próprio e o último admin ativo", "204 / 404 / 409"],
  ["POST", "/api/auth/login", "Todos", "Descobre o cliente pelo e-mail; trava depois de 5 erros", "200 / 401 / 429"],
];

const central = [
  ["cliente", "id, cd_cliente (código curto, ex.: escola-abc), nm_cliente, nm_banco, st_ativo, dt_criacao", "Um registro por escola, com o nome do banco dela. st_ativo falso bloqueia a escola inteira: login recusado e tokens derrubados."],
  ["login", "email (chave), cliente_id", "Cada e-mail de login aponta para um cliente. É por ela que o login acha o banco, e é ela que garante o e-mail único no sistema inteiro."],
];

const flyway = [
  ["db/central/V1__catalogo.sql", "Estrutura do banco central (cliente e login)."],
  ["db/migration/V1__estrutura_inicial.sql", "Estrutura do banco de cada cliente: o antigo db/schema.sql, que ficou congelado como referência."],
  ["db/migration/V2__..., V3__...", "Mudanças futuras, uma por arquivo, numeradas. Um arquivo que já rodou nunca é editado."],
];

const comandos = [
  ["--novo-cliente --codigo --nome --cnpj --admin-email", "Cria o banco da escola (prefixo + código), monta a estrutura, importa a geografia do IBGE, cria a empresa e o primeiro admin e mostra uma senha provisória uma vez só."],
  ["--novo-cliente --codigo --nome --banco-existente", "Adota um banco que já existia (como o de desenvolvimento): marca a estrutura como versão 1 sem refazer nada e põe os e-mails dele na lista central."],
  ["--redefinir-senha --email", "Gera uma senha provisória nova para um acesso (para quem esqueceu e não tem outro admin que troque pela tela). Derruba os tokens antigos desse acesso."],
];

const exemploComandos = [
  "Cliente novo:",
  "  --novo-cliente --codigo=escola-abc --nome=\"Escola ABC\" --cnpj=11222333000181 --admin-email=dono@escolaabc.com.br",
  "",
  "Adotar o banco que já existe:",
  "  --novo-cliente --codigo=escola-teste --nome=\"Escola Teste\" --banco-existente=impulso",
  "",
  "Nova senha:",
  "  --redefinir-senha --email=dono@escolaabc.com.br",
  "",
  "Pelo IntelliJ: cópia da run config ImpulsoApplication, com o texto acima em Program arguments.",
  "Pelo jar: java -jar impulso.jar <argumentos>  (com DB_PASSWORD e JWT_SECRET no ambiente)",
];

const configuracao = [
  ["app.banco.servidor", "jdbc:postgresql://localhost:5432/", "Servidor PostgreSQL de todos os bancos."],
  ["app.banco.usuario / app.banco.senha", "postgres / ${DB_PASSWORD}", "Usuário e senha (a senha vem da variável de ambiente)."],
  ["app.banco.central", "impulso_central", "Nome do banco central (precisa existir antes de subir)."],
  ["app.banco.prefixo", "impulso_", "Prefixo do banco de um cliente novo (impulso_ + código)."],
  ["app.banco.conexoes-por-cliente", "5", "Tamanho do grupo de conexões de cada cliente."],
  ["app.jwt.expiration-ms", "28800000", "Validade do token (8 horas)."],
  ["app.login.max-tentativas / app.login.bloqueio-minutos", "5 / 15", "Limite de tentativas de login."],
];

const erros = [
  ["401", "Login: e-mail sem cliente, cliente bloqueado, senha errada ou acesso bloqueado (sempre a mesma mensagem). Outros pedidos: token vencido, adulterado, de acesso bloqueado ou de senha trocada.", "{\"erro\": \"Credenciais inválidas\"}"],
  ["429", "Quinta senha errada seguida, enquanto durar o bloqueio", "{\"erro\": \"Muitas tentativas erradas. Tente de novo em 15 minuto(s)!\"}"],
  ["409", "E-mail que já é login em qualquer cliente; bloquear o próprio acesso; bloquear o último admin ativo", "{\"erro\": \"Email já cadastrado!\"}"],
];

const criterios = [
  ["B", "Bloqueio vale na hora", "Um admin logado", "Outro admin bloqueia o acesso dele", "O pedido seguinte com o token antigo recebe 401"],
  ["B", "Senha trocada", "Um acesso logado", "A senha é trocada", "O token antigo recebe 401 e só a senha nova entra"],
  ["B", "Tentativas", "Um e-mail", "5 senhas erradas seguidas", "A 6ª tentativa recebe 429, mesmo com a senha certa; outro e-mail entra normalmente"],
  ["B", "Token adulterado", "Um token válido", "O cliente ou a assinatura é trocado", "401 antes de qualquer leitura no banco"],
  ["C", "Isolamento", "Duas escolas", "Uma pede um aluno da outra pelo id", "404; listas, empresa e usuários de cada uma ficam separados"],
  ["C", "E-mail único", "Um e-mail que é login na escola A", "A escola B tenta usá-lo (até com maiúsculas)", "409; depois de A trocar o e-mail, B pode usar o antigo"],
  ["C", "Escola bloqueada", "A escola A bloqueada no banco central", "Alguém de A usa o token ou faz login", "401; a escola B segue funcionando"],
  ["C", "Mudança de estrutura", "Três bancos de cliente na versão 1", "Um V2 é acrescentado e o backend sobe", "O V2 é aplicado nos três"],
  ["C", "Adoção", "Um banco que já existia", "Comando com --banco-existente", "Marcado como versão 1, e-mails na lista central, login funcionando sem reiniciar o backend"],
];

const lgpd = [
  "O Impulso guarda dados de crianças e dados que contam como saúde (peso, estatura, cintura e IMC), que têm proteção reforçada na LGPD (arts. 11 e 14).",
  "Consentimento: não é registrado no sistema. O termo assinado pelos pais é colhido fora dele (por exemplo, na matrícula).",
  "Exclusão: os dados são mantidos para consulta (o aluno é inativado, não apagado). A política de privacidade precisa dizer por quanto tempo e por quê.",
  "Política de privacidade, termo e contrato entre a escola (controladora) e o Impulso (operador) ficam fora do sistema e precisam de validação jurídica.",
  "Cada escola tem o próprio banco, o que isola os dados e facilita backup e devolução por cliente.",
  "Adiado: aviso de privacidade dentro do sistema, registro de quem fez o quê (auditoria) e prazo de guarda.",
];

const falta = [
  ["Hospedagem e domínio", "Escolher onde hospedar (de preferência sem custo no começo) e o endereço do sistema.", "Pendente"],
  ["HTTPS e cabeçalhos", "Certificado para o domínio e cabeçalhos de segurança no servidor do site.", "Pendente"],
  ["Limite por IP", "Completar o limite de tentativas no servidor ou proxy (hoje a contagem é por e-mail e fica na memória).", "Pendente"],
  ["Backup", "Cópia periódica de cada banco, criptografada.", "Pendente"],
  ["Produção", "Rodar com SPRING_PROFILES_ACTIVE=prod e o usuário do banco com permissão de criar bancos (para o comando de cliente novo).", "Pendente"],
];

const tarefas = [
  ["1", "Aba Usuários: GET /api/usuario e POST /api/usuario/admin; regras de bloqueio; AdminInicial só sem nenhum admin", "Concluída"],
  ["2", "Token rechecado a cada pedido, validade de 8 h, limite de tentativas, e-mail sem maiúsculas, perfil prod", "Concluída"],
  ["3", "Fontes servidas com o site", "Concluída"],
  ["4", "Modelo 2: banco central, banco por cliente, login pelo e-mail, Flyway", "Concluída"],
  ["5", "Comandos de cliente novo, adoção de banco e nova senha; AdminInicial removido", "Concluída"],
  ["6", "Adoção do banco de desenvolvimento como primeiro cliente (escola-teste)", "Concluída"],
  ["7", "Colocar no ar (hospedagem, domínio, HTTPS, backup)", "Pendente"],
];

const dotArquitetura = `digraph MC {
  rankdir=LR; graph [fontname="Helvetica", nodesep=0.4, ranksep=0.6];
  node [fontname="Helvetica", fontsize=10, shape=box, style="filled,rounded", fontcolor="white"];
  edge [fontname="Helvetica", fontsize=9, color="#555555"];
  N [label="Navegador\\n(mesmo endereço\\npara todos)", fillcolor="#7C5CD6"];
  subgraph cluster_back { label="Backend (um só)"; fontname="Helvetica"; fontsize=11; color="#999999"; style=dashed;
    F [label="ClienteDoPedido\\nlê o cliente no token", fillcolor="#833C0C"];
    S [label="Spring Security\\nassinatura + validade\\n+ UsuarioAtivoValidator", fillcolor="#833C0C"];
    C [label="Controllers\\ne Services\\n(sem mudança)", fillcolor="#1F3864"];
    B [label="BancoDosClientes\\nconexão do banco\\ndo cliente do pedido", fillcolor="#2E75B6"]; }
  CE [label="impulso_central\\ncliente | login", fillcolor="#548235", shape=cylinder];
  D1 [label="banco da\\nescola A", fillcolor="#548235", shape=cylinder];
  D2 [label="banco da\\nescola B", fillcolor="#548235", shape=cylinder];
  N -> F -> S -> C -> B; B -> D1; B -> D2;
  S -> CE [style=dashed, label=" escola ativa? "];
}`;

const dotLogin = `digraph Login {
  rankdir=TB; graph [fontname="Helvetica", nodesep=0.4, ranksep=0.35];
  node [fontname="Helvetica", fontsize=11, shape=box, style="filled,rounded", fontcolor="white", width=4.4];
  edge [fontname="Helvetica", fontsize=10, color="#555555"];
  L1 [label="POST /api/auth/login (e-mail e senha)", fillcolor="#2E75B6"];
  L2 [label="Login travado por tentativas?", shape=diamond, fillcolor="#833C0C", width=3.2];
  L3 [label="429", fillcolor="#7F7F7F", width=1.2];
  L4 [label="Procura o e-mail na lista central (login)\\ne confere se a escola está ativa", fillcolor="#1F3864"];
  L5 [label="Confere a senha no banco da escola", fillcolor="#1F3864"];
  L6 [label="401 genérico\\n(conta mais uma tentativa)", fillcolor="#7F7F7F", width=2.6];
  L7 [label="Token com cliente, usuarioId, perfil e carimbo da senha\\n(vale 8 horas)", fillcolor="#548235"];
  L1 -> L2; L2 -> L3 [label="sim"]; L2 -> L4 [label="não"]; L4 -> L5 [label="achou"]; L4 -> L6 [label="não achou"];
  L5 -> L7 [label="certa"]; L5 -> L6 [label="errada"];
}`;

const celula = (texto, largura, { negrito = false, fundo, cor, fonte, tamanho } = {}) => new TableCell({
  width: { size: largura, type: WidthType.DXA },
  shading: fundo ? { type: ShadingType.CLEAR, fill: fundo } : undefined,
  margins: { top: 70, bottom: 70, left: 90, right: 90 },
  children: [new Paragraph({ children: [new TextRun({ text: texto, bold: negrito, color: cor, font: fonte, size: tamanho })] })],
});

function tabela(cabecalho, larguras, linhas, { monoCols = [], tamanho } = {}) {
  return new Table({
    width: { size: larguras.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: larguras,
    rows: [
      new TableRow({ tableHeader: true, children: cabecalho.map((c, i) => celula(c, larguras[i], { negrito: true, fundo: HEADER_BG, cor: "FFFFFF", tamanho })) }),
      ...linhas.map((l, idx) => new TableRow({ children: l.map((v, i) => celula(v, larguras[i], {
        fundo: v === "Pendente" ? "FCE4D6" : v === "Adiada" ? "EDEDED" : (idx % 2 ? "F2F2F2" : undefined),
        fonte: monoCols.includes(i) ? "Consolas" : undefined, tamanho,
      })) })),
    ],
  });
}

function blocoCodigo(linhas) {
  const borda = { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" };
  return new Table({
    width: { size: 9500, type: WidthType.DXA }, columnWidths: [9500],
    borders: { top: borda, bottom: borda, left: borda, right: borda },
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9500, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: "F5F5F5" },
      margins: { top: 150, bottom: 150, left: 200, right: 200 },
      children: linhas.map((l) => new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: l || " ", font: "Consolas", size: 16 })] })),
    })] })],
  });
}

async function imagem(viz, dot, largura) {
  const svg = viz.renderString(dot, { format: "svg" })
    .replace(/font-family="Helvetica,sans-Serif"/g, 'font-family="Arial"'); // Helvetica não existe no Windows; Arial tem as mesmas medidas
  const png = await sharp(Buffer.from(svg), { density: 200 }).png().toBuffer();
  const { width, height } = await sharp(png).metadata();
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
    new ImageRun({ data: png, type: "png", transformation: { width: largura, height: height * (largura / width) } }),
  ] });
}

async function main() {
  const viz = await instance();
  const h1 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 150 } });
  const h2 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } });
  const p = (t) => new Paragraph({ children: [new TextRun(t)], spacing: { after: 120 } });
  const item = (t) => new Paragraph({ text: t, bullet: { level: 0 }, spacing: { after: 60 } });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "Impulso", bold: true, size: 44, color: HEADER_BG })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "Especificação Detalhada — Fase 5: Segurança e Vários Clientes", size: 30 })] }),
        p("A Fase 5 prepara o Impulso para atender escolas de verdade. Ela fecha as brechas de segurança encontradas na revisão, permite mais de um administrador e troca o modelo de uma instalação por cliente pelo Modelo 2: um backend só, um banco para cada escola e um endereço único, em que o e-mail diz de qual escola é o login. Cada parte foi testada numa cópia do backend com bancos de teste antes de ir para o projeto, e o banco de desenvolvimento foi adotado como o primeiro cliente."),

        h1("1. Blocos da Fase"),
        tabela(["Bloco", "Entrega", "O que muda para o usuário", "Requisito"], [700, 2000, 5600, 1200], blocos),

        h1("2. Usuários e Administradores"),
        p("A aba Usuários (Fase 4) lista todos os acessos da escola, com o nome da pessoa dona de cada um, e cadastra outros administradores, que não dependem de uma pessoa cadastrada: só e-mail e senha. Profissionais e responsáveis continuam ganhando acesso nas telas deles."),
        tabela(["Situação", "Resposta"], [3000, 6500], regrasUsuarios),
        tabela(["Método", "Rota", "Perfil", "Descrição", "Respostas"], [900, 2700, 1100, 3300, 1500], rotas, { monoCols: [1], tamanho: 18 }),

        h1("3. Segurança"),
        tabela(["Medida", "Como funciona", "Onde fica"], [2200, 5000, 2300], seguranca, { tamanho: 19 }),
        p("Os tokens anteriores a estas mudanças não têm o cliente nem o carimbo da senha, então todos precisam entrar de novo depois da atualização."),

        h1("4. Vários Clientes (Modelo 2)"),
        await imagem(viz, dotArquitetura, 640),
        p("O primeiro filtro de cada pedido lê no token de qual escola ele é e guarda essa informação para o resto do pedido (ClienteAtual). O Spring Security confere a assinatura e a validade e, só então, o UsuarioAtivoValidator lê o banco da escola. Daí em diante, toda conexão que o JPA pede ao BancoDosClientes é do banco daquela escola. Controllers, services e repositories não mudaram."),
        h2("4.1 Login pelo e-mail"),
        await imagem(viz, dotLogin, 420),
        p("O e-mail de login é único no sistema inteiro. Uma pessoa com acesso em duas escolas usa um e-mail em cada uma. Criar um acesso ou trocar o e-mail atualiza a lista central junto com o banco da escola; se a gravação no banco da escola não se confirmar, a mudança na lista central é desfeita."),
        h2("4.2 Banco central"),
        tabela(["Tabela", "Colunas", "Para que serve"], [1300, 3700, 4500], central, { tamanho: 19 }),
        h2("4.3 Estrutura dos bancos com Flyway"),
        p("Quando o backend sobe, o Flyway atualiza o banco central e o banco de cada escola ativa, aplicando só os arquivos que ainda não rodaram em cada um (o controle fica na tabela flyway_schema_history de cada banco). Um banco que já existia antes do Flyway é marcado como versão 1 sem refazer nada. O Hibernate não cria nem confere tabelas na subida, porque o banco só é conhecido a cada pedido."),
        tabela(["Arquivo", "O que é"], [3600, 5900], flyway, { monoCols: [0], tamanho: 19 }),
        h2("4.4 Comandos de administração"),
        p("Os comandos rodam o próprio backend numa porta livre qualquer, fazem o serviço e terminam. Podem rodar com o backend principal ligado."),
        tabela(["Argumentos", "O que faz"], [3600, 5900], comandos, { monoCols: [0], tamanho: 19 }),
        blocoCodigo(exemploComandos),

        h1("5. Configuração"),
        p("Variáveis de ambiente: DB_PASSWORD e JWT_SECRET. ADMIN_EMAIL e ADMIN_SENHA não são mais usadas (o primeiro admin vem do comando de cliente novo)."),
        tabela(["Propriedade", "Valor", "Para que serve"], [3300, 2700, 3500], configuracao, { monoCols: [0, 1], tamanho: 18 }),

        h1("6. Novos Casos de Erro"),
        tabela(["Código", "Quando acontece", "Exemplo de corpo"], [800, 5300, 3400], erros, { monoCols: [2], tamanho: 18 }),

        h1("7. Critérios de Aceite"),
        p("Formato Dado / Quando / Então. Todos foram verificados numa cópia do backend com bancos de teste, junto com os testes de usuários (35), de segurança (21) e com as 110 chamadas do frontend."),
        tabela(["Bloco", "Cenário", "Dado", "Quando", "Então"], [700, 1600, 2300, 2400, 2500], criterios, { tamanho: 18 }),

        h1("8. LGPD: Decisões Registradas"),
        ...lgpd.map(item),

        h1("9. O que Falta para Colocar no Ar"),
        tabela(["Item", "O que é", "Status"], [2200, 5800, 1500], falta),

        h1("10. Tarefas da Fase 5"),
        tabela(["#", "Tarefa", "Status"], [600, 7400, 1500], tarefas),
      ],
    }],
  });

  fs.writeFileSync(SAIDA, await Packer.toBuffer(doc));
  console.log("OK: " + SAIDA);
}

main().catch((e) => { console.error(e); process.exit(1); });
