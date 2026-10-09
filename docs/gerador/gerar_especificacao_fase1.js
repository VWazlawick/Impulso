// Uso: node gerar_especificacao_fase1.js [saida.docx]  (padrão: ../Especificacao_Detalhada_Fase1.docx)
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { instance } = require("@viz-js/viz");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  AlignmentType, ShadingType, Table, TableRow, TableCell, WidthType, BorderStyle
} = require("docx");

const HEADER_BG = "1F3864";
const SAIDA = process.argv[2] || path.join(__dirname, "..", "Especificacao_Detalhada_Fase1.docx");

const entidades = [
  ["Pessoa (abstrata)", "nmPessoa (obrigatório), cpf (11 dígitos, único entre todas as pessoas), email", "Herança JOINED. Não é instanciada diretamente; telefones e endereços pertencem a ela."],
  ["Profissional", "herda Pessoa; empresa (obrigatória, a da instância); usuario (opcional)", "CPF obrigatório. Só ADMIN cadastra e edita."],
  ["Responsavel", "herda Pessoa; usuario (opcional)", "CPF obrigatório. ADMIN e PROFISSIONAL cadastram e editam."],
  ["Aluno", "herda Pessoa; dtNascimento (passado), tpServico, profissional (dono), responsaveis (N:N)", "CPF opcional. O profissional só acessa os próprios alunos; o ADMIN acessa todos."],
  ["Usuario", "email (login, único), snUsuario (BCrypt), tpUsuario, stAtivo", "Criado para uma pessoa existente; tipo deduzido do tipo da pessoa. Inativado, nunca excluído."],
  ["Empresa", "razaoSocial, cnpj (14 dígitos)", "Uma por instância; criada/atualizada pelo ADMIN."],
  ["Endereco / Telefone", "endereço: rua, nrCasa, bairro, cep (8 dígitos), complemento, cidade; telefone: nrTelefone", "Pertencem a uma Pessoa (pendente: service e controller)."],
  ["Pais / Estado / Cidade", "nm*, sg* (2 letras)", "Dados de referência, somente leitura pela API (pendente: carga inicial)."],
];

const permissoes = [
  ["Login, documentação (Swagger)", "✔", "✔", "✔"],
  ["Consultar países, estados e cidades", "✔", "✔", "✔"],
  ["Consultar a empresa", "✔", "✔", "—"],
  ["Salvar a empresa", "✔", "—", "—"],
  ["Cadastrar/editar profissionais", "✔", "—", "—"],
  ["Cadastrar/editar responsáveis", "✔", "✔", "—"],
  ["Criar acesso para profissional", "✔", "—", "—"],
  ["Criar acesso para responsável", "✔", "✔", "—"],
  ["Ver os próprios dados (/me)", "✔", "✔", "✔"],
  ["Consultar, editar, inativar e reativar qualquer usuário", "✔", "—", "—"],
  ["Cadastrar aluno", "✔ (escolhe o profissional)", "✔ (dono = ele)", "—"],
  ["Listar, ver, editar alunos e vincular responsáveis", "✔ (todos)", "✔ (só os seus)", "—"],
  ["Transferir aluno para outro profissional", "✔", "—", "—"],
];

const rotas = [
  ["POST", "/api/auth/login", "Público", "Login; devolve token e tipo", "200 / 401"],
  ["GET", "/api/paises", "Logado", "Países em ordem alfabética", "200"],
  ["GET", "/api/estados?paisId=", "Logado", "Estados de um país", "200 / 400"],
  ["GET", "/api/cidades?estadoId=", "Logado", "Cidades de um estado", "200 / 400"],
  ["GET", "/api/empresa/atual", "ADMIN, PROFISSIONAL", "Dados da empresa", "200 / 404"],
  ["PUT", "/api/empresa", "ADMIN", "Cria ou atualiza a empresa", "200 / 400"],
  ["POST", "/api/profissional", "ADMIN", "Cadastra profissional", "201 / 400 / 404 / 409"],
  ["GET", "/api/profissional", "ADMIN", "Lista profissionais", "200"],
  ["GET", "/api/profissional/{id}", "ADMIN", "Busca profissional", "200 / 404"],
  ["PUT", "/api/profissional/{id}", "ADMIN", "Edita profissional", "200 / 400 / 404 / 409"],
  ["POST", "/api/responsavel", "ADMIN, PROFISSIONAL", "Cadastra responsável", "201 / 400 / 409"],
  ["GET", "/api/responsavel?nome=", "ADMIN, PROFISSIONAL", "Lista; filtra por parte do nome", "200"],
  ["GET", "/api/responsavel/{id}", "ADMIN, PROFISSIONAL", "Busca responsável", "200 / 404"],
  ["PUT", "/api/responsavel/{id}", "ADMIN, PROFISSIONAL", "Edita responsável", "200 / 400 / 404 / 409"],
  ["POST", "/api/usuario", "ADMIN, PROFISSIONAL", "Cria acesso para uma pessoa", "201 / 400 / 403 / 404 / 409"],
  ["GET", "/api/usuario/me", "Logado", "Dados do próprio usuário", "200"],
  ["GET", "/api/usuario/{id}", "ADMIN", "Busca usuário", "200 / 404"],
  ["PUT", "/api/usuario/{id}", "ADMIN", "Edita e-mail e, opcionalmente, senha", "200 / 400 / 404 / 409"],
  ["PATCH", "/api/usuario/{id}/inativar", "ADMIN", "Bloqueia o login", "204 / 404"],
  ["PATCH", "/api/usuario/{id}/reativar", "ADMIN", "Libera o login", "204 / 404"],
  ["POST", "/api/aluno", "ADMIN, PROFISSIONAL", "Cadastra aluno", "201 / 400 / 403 / 404 / 409"],
  ["GET", "/api/aluno", "ADMIN, PROFISSIONAL", "Lista alunos (ADMIN: todos)", "200"],
  ["GET", "/api/aluno/{id}", "ADMIN, PROFISSIONAL", "Busca aluno", "200 / 404"],
  ["PUT", "/api/aluno/{id}", "ADMIN, PROFISSIONAL", "Edita aluno", "200 / 400 / 404 / 409"],
  ["PATCH", "/api/aluno/{id}/profissional", "ADMIN", "Transfere para outro profissional", "200 / 400 / 404"],
  ["GET", "/api/aluno/{id}/responsaveis", "ADMIN, PROFISSIONAL", "Responsáveis do aluno", "200 / 404"],
  ["POST", "/api/aluno/{id}/responsavel/{responsavelId}", "ADMIN, PROFISSIONAL", "Vincula responsável", "204 / 404 / 409"],
  ["DELETE", "/api/aluno/{id}/responsavel/{responsavelId}", "ADMIN, PROFISSIONAL", "Desvincula responsável", "204 / 404"],
];

const erros = [
  ["400", "Dados inválidos no corpo (com a mensagem de cada campo), parâmetro obrigatório ausente, ou requisição incompleta (ex.: ADMIN cadastrando aluno sem profissional)", "{\"erro\": \"Dados Inválidos\", \"campos\": {\"cpf\": \"...\"}}"],
  ["401", "Sem token, token inválido/expirado, ou login com credenciais erradas / usuário inativo", "{\"erro\": \"Credenciais inválidas\"}"],
  ["403", "Logado, mas sem o perfil necessário", "{\"erro\": \"Acesso Negado\"}"],
  ["404", "Registro inexistente, ou aluno de outro profissional (não revela que existe)", "{\"erro\": \"Aluno não encontrado!\"}"],
  ["409", "Violação de unicidade ou de regra: CPF/e-mail repetido, pessoa que já tem acesso, aluno recebendo acesso, vínculo duplicado", "{\"erro\": \"CPF já cadastrado!\"}"],
];

const criterios = [
  ["RF10", "Login com senha correta", "um usuário ativo", "faz POST /api/auth/login", "recebe 200 com token JWT válido por 24h"],
  ["RF10", "Login de usuário inativo", "um usuário com stAtivo = false", "tenta fazer login", "recebe 401"],
  ["RF02", "Só ADMIN cadastra profissional", "um PROFISSIONAL logado", "faz POST /api/profissional", "recebe 403"],
  ["RF03", "CPF único entre pessoas", "um responsável com CPF X", "cadastra um profissional com o mesmo CPF", "recebe 409"],
  ["RF11", "Profissional cria acesso para responsável", "um PROFISSIONAL logado", "cria acesso para um responsável", "recebe 201 e o usuário nasce com tipo RESPONSAVEL"],
  ["RF11", "Profissional não cria acesso para profissional", "um PROFISSIONAL logado", "tenta criar acesso para outro profissional", "recebe 403"],
  ["RF12", "Admin inativa usuário", "um ADMIN logado", "faz PATCH /api/usuario/{id}/inativar", "recebe 204 e aquele usuário passa a receber 401 no login"],
  ["RF01", "Aluno sem CPF", "um PROFISSIONAL logado", "cadastra e depois edita dois alunos sem CPF", "as duas operações funcionam (CPF é opcional)"],
  ["RC01", "Isolamento entre profissionais", "o aluno X pertence ao profissional A", "o profissional B tenta abri-lo", "recebe 404"],
  ["RF01", "Admin cadastra escolhendo o profissional", "um ADMIN logado", "cadastra aluno sem informar profissionalId", "recebe 400"],
  ["—", "Transferência de aluno", "um ADMIN logado", "transfere o aluno de A para B", "o aluno some da lista de A e aparece na de B"],
  ["RF13", "Vínculo duplicado", "aluno já vinculado ao responsável R", "vincula R de novo", "recebe 409"],
];

const tarefas = [
  ["1", "Ambiente, banco (schema.sql) e projeto Spring Boot", "Concluída"],
  ["2", "Entidades JPA, com herança de Pessoa", "Concluída"],
  ["3", "Repositórios e consultas derivadas", "Concluída"],
  ["4", "Segurança: JWT (resource server), BCrypt, usuário inativo", "Concluída"],
  ["5", "Login (AuthController/AuthService) e admin inicial", "Concluída"],
  ["6", "DTOs, tratamento padronizado de erros e services", "Concluída"],
  ["7", "Controllers, permissões por perfil e Swagger", "Concluída"],
  ["8", "Carga de país, estado e cidade", "Pendente"],
  ["9", "Endereço e telefone (service e controller)", "Pendente"],
  ["10", "Testes automatizados dos critérios de aceite", "Pendente"],
];

const exemplos = [
  "POST /api/auth/login",
  "{ \"email\": \"admin@impulso.com\", \"senha\": \"********\" }",
  "→ 200 { \"token\": \"eyJhbGciOiJIUzI1NiJ9...\", \"tipo\": \"ADMIN\" }",
  "",
  "POST /api/aluno            (Authorization: Bearer <token de ADMIN>)",
  "{ \"nmPessoa\": \"João Pedro\", \"dtNascimento\": \"2018-04-12\",",
  "  \"tpServico\": \"DUAS_VEZES_SEMANA\", \"profissionalId\": 7 }",
  "→ 201 { \"id\": 42, \"nmPessoa\": \"João Pedro\", \"cpf\": null, \"email\": null,",
  "        \"dtNascimento\": \"2018-04-12\", \"tpServico\": \"DUAS_VEZES_SEMANA\", \"profissionalId\": 7 }",
  "",
  "PATCH /api/aluno/42/profissional   (somente ADMIN)",
  "{ \"profissionalId\": 9 }",
  "→ 200 { ..., \"profissionalId\": 9 }",
];

const dotAuth = `digraph Auth {
  rankdir=TB; graph [fontname="Helvetica", nodesep=0.5, ranksep=0.45, splines=ortho];
  node [fontname="Helvetica", fontsize=12, shape=box, style="filled,rounded", fontcolor="white", width=3.8];
  edge [fontname="Helvetica", fontsize=10, color="#555555"];
  subgraph cluster_login { label="1. Login"; style=filled; color="#EDEDED"; fontname="Helvetica-Bold"; fontsize=13;
    L1 [label="POST /api/auth/login\\n{ email, senha }", fillcolor="#2E75B6"];
    L2 [label="AuthService chama o AuthenticationManager", fillcolor="#1F3864"];
    L3 [label="UserDetailsServiceImpl busca pelo e-mail;\\nBCrypt compara a senha; inativo é recusado", fillcolor="#1F3864"];
    L4 [label="Credenciais ok?", shape=diamond, fillcolor="#833C0C", width=2.6, height=0.9];
    L5 [label="401 { erro: Credenciais inválidas }", fillcolor="#833C0C"];
    L6 [label="TokenService gera JWT HS256\\n(sub=email, usuarioId, roles, 24h)", fillcolor="#1F3864"];
    L7 [label="200 { token, tipo }", fillcolor="#2E75B6"];
    L1 -> L2 -> L3 -> L4; L4 -> L5 [label="não"]; L4 -> L6 [label="sim"]; L6 -> L7;
  }
  subgraph cluster_req { label="2. Requisições autenticadas"; style=filled; color="#DDEBF7"; fontname="Helvetica-Bold"; fontsize=13;
    R1 [label="Requisição com header\\nAuthorization: Bearer <token>", fillcolor="#2E75B6"];
    R2 [label="Filtro do Spring (oauth2-resource-server)\\nvalida assinatura e expiração", fillcolor="#833C0C"];
    R3 [label="Token válido?", shape=diamond, fillcolor="#833C0C", width=2.6, height=0.9];
    R4 [label="401", fillcolor="#833C0C"];
    R5 [label="@PreAuthorize confere o perfil (roles)", fillcolor="#1F3864"];
    R6 [label="Perfil permitido?", shape=diamond, fillcolor="#833C0C", width=2.6, height=0.9];
    R7 [label="403 { erro: Acesso Negado }", fillcolor="#833C0C"];
    R8 [label="Controller monta o Solicitante\\ne chama o service", fillcolor="#548235"];
    R1 -> R2 -> R3; R3 -> R4 [label="não"]; R3 -> R5 [label="sim"]; R5 -> R6; R6 -> R7 [label="não"]; R6 -> R8 [label="sim"];
  }
  L7 -> R1 [style=dashed, label="  token usado nas próximas chamadas  "];
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
        fundo: v === "Pendente" ? "FCE4D6" : (idx % 2 ? "F2F2F2" : undefined),
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
      children: linhas.map((l) => new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: l || " ", font: "Consolas", size: 18 })] })),
    })] })],
  });
}

async function main() {
  const viz = await instance();
  const svg = viz.renderString(dotAuth, { format: "svg" });
  const png = await sharp(Buffer.from(svg), { density: 200 }).png().toBuffer();
  const { width, height } = await sharp(png).metadata();
  const larguraImg = 430;

  const h1 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 150 } });
  const p = (t) => new Paragraph({ children: [new TextRun(t)], spacing: { after: 120 } });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "Impulso", bold: true, size: 44, color: HEADER_BG })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "Especificação Detalhada — Fase 1", size: 30 })] }),
        p("A Fase 1 entrega a base do backend: cadastro de pessoas e acessos, login com JWT, permissões por perfil e a API REST documentada no Swagger (http://localhost:8080/swagger-ui.html). Este documento descreve o que foi implementado e o que ainda falta para concluir a fase."),

        h1("1. Entidades"),
        tabela(["Entidade", "Campos principais", "Regras"], [2000, 3900, 3600], entidades),

        h1("2. Perfis e Permissões"),
        p("O perfil vem do token (claim roles). As permissões são aplicadas com @PreAuthorize nos controllers; o isolamento de alunos por profissional é aplicado no AlunoService."),
        tabela(["Ação", "ADMIN", "PROFISSIONAL", "RESPONSÁVEL"], [4300, 1800, 1800, 1600], permissoes),

        h1("3. Contrato da API"),
        p("Todas as rotas, exceto o login e o Swagger, exigem o header Authorization: Bearer <token>."),
        tabela(["Método", "Rota", "Perfil", "Descrição", "Respostas"], [900, 3200, 1700, 2100, 1600], rotas, { monoCols: [1], tamanho: 18 }),

        h1("4. Padrão de Erros"),
        tabela(["Código", "Quando acontece", "Exemplo de corpo"], [800, 5100, 3600], erros, { monoCols: [2], tamanho: 18 }),

        h1("5. Exemplos de Requisição"),
        blocoCodigo(exemplos),

        h1("6. Fluxo de Autenticação e Autorização"),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
          new ImageRun({ data: png, type: "png", transformation: { width: larguraImg, height: height * (larguraImg / width) } }),
        ] }),

        h1("7. Critérios de Aceite"),
        p("Formato Dado / Quando / Então. Todos foram verificados em testes de ponta a ponta durante o desenvolvimento; a Tarefa 10 transforma esses cenários em testes automatizados do projeto."),
        tabela(["Req.", "Cenário", "Dado", "Quando", "Então"], [800, 2100, 2000, 2200, 2400], criterios, { tamanho: 18 }),

        h1("8. Tarefas da Fase 1"),
        tabela(["#", "Tarefa", "Status"], [600, 7200, 1700], tarefas),
      ],
    }],
  });

  fs.writeFileSync(SAIDA, await Packer.toBuffer(doc));
  console.log("OK: " + SAIDA);
}

main().catch((e) => { console.error(e); process.exit(1); });
