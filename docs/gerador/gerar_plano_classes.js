// Uso: node gerar_plano_classes.js  (gera ../Plano_de_Classes.docx)
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { instance } = require("@viz-js/viz");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  AlignmentType, ShadingType, Table, TableRow, TableCell, WidthType
} = require("docx");

const HEADER_BG = "1F3864";
const SAIDA = process.argv[2] || path.join(__dirname, "..", "Plano_de_Classes.docx");

const grupos = [
  { nome: "Geografia (referência)", cor: "#EDEDED", classes: [
    ["Pais", [["id", "Long"], ["nmPais", "String"], ["sgPais", "String"]]],
    ["Estado", [["id", "Long"], ["nmEstado", "String"], ["sgEstado", "String"], ["pais", "Pais"]]],
    ["Cidade", [["id", "Long"], ["nmCidade", "String"], ["estado", "Estado"]]],
  ]},
  { nome: "Pessoas e Acesso", cor: "#E2EFDA", classes: [
    ["Pessoa", [["id", "Long"], ["nmPessoa", "String"], ["cpf", "String"], ["email", "String"]], "abstract"],
    ["Profissional", [["usuario", "Usuario"], ["empresa", "Empresa"]]],
    ["Responsavel", [["usuario", "Usuario"]]],
    ["Usuario", [["id", "Long"], ["email", "String"], ["snUsuario", "String"], ["stAtivo", "boolean"], ["tpUsuario", "TipoUsuarioEnum"]]],
    ["Empresa", [["id", "Long"], ["razaoSocial", "String"], ["cnpj", "String"]]],
    ["Endereco", [["id", "Long"], ["rua", "String"], ["nrCasa", "String"], ["bairro", "String"], ["cep", "String"], ["complemento", "String"], ["cidade", "Cidade"], ["pessoa", "Pessoa"]]],
    ["Telefone", [["id", "Long"], ["nrTelefone", "String"], ["pessoa", "Pessoa"]]],
    ["TipoUsuarioEnum", [["ADMIN", ""], ["PROFISSIONAL", ""], ["RESPONSAVEL", ""]], "enumeration"],
  ]},
  { nome: "Aluno", cor: "#FFF2CC", classes: [
    ["Aluno", [["dtNascimento", "LocalDate"], ["tpServico", "TipoServicoEnum"], ["profissional", "Profissional"], ["responsaveis", "Set<Responsavel>"]]],
    ["TipoServicoEnum", [["UMA_VEZ_SEMANA", ""], ["DUAS_VEZES_SEMANA", ""], ["DIARIA", ""]], "enumeration"],
  ]},
  { nome: "Avaliação (Fase 2 — planejado)", cor: "#DDEBF7", classes: [
    ["Questionario", [["id", "Long"], ["nome", "String"], ["idadeMin", "Integer"], ["idadeMax", "Integer"]]],
    ["Pergunta", [["id", "Long"], ["enunciado", "String"], ["tipo", "TipoPerguntaEnum"], ["unidade", "String"], ["categoria", "String"], ["indice", "Integer"], ["questionario", "Questionario"]]],
    ["OpcaoPergunta", [["id", "Long"], ["texto", "String"], ["ordem", "Integer"], ["pergunta", "Pergunta"]]],
    ["Avaliacao", [["id", "Long"], ["data", "LocalDate"], ["aluno", "Aluno"], ["profissional", "Profissional"], ["questionario", "Questionario"]]],
    ["Resposta", [["id", "Long"], ["valor", "String"], ["avaliacao", "Avaliacao"], ["pergunta", "Pergunta"]]],
    ["AvaliacaoResumo", [["id", "Long"], ["categoria", "String"], ["score", "BigDecimal"], ["avaliacao", "Avaliacao"]]],
  ]},
];

const heranca = [["Profissional", "Pessoa"], ["Responsavel", "Pessoa"], ["Aluno", "Pessoa"]];

const associacoes = [
  ["Pais", "Estado", "1", "N"], ["Estado", "Cidade", "1", "N"], ["Cidade", "Endereco", "1", "N"],
  ["Pessoa", "Endereco", "1", "N"], ["Pessoa", "Telefone", "1", "N"],
  ["Usuario", "Profissional", "0..1", "1"], ["Usuario", "Responsavel", "0..1", "1"],
  ["Empresa", "Profissional", "1", "N"], ["Profissional", "Aluno", "1", "N"],
  ["Aluno", "Responsavel", "N", "N"],
  ["Questionario", "Pergunta", "1", "N"], ["Pergunta", "OpcaoPergunta", "1", "N"],
  ["Aluno", "Avaliacao", "1", "N"], ["Questionario", "Avaliacao", "1", "N"],
  ["Avaliacao", "Resposta", "1", "N"], ["Pergunta", "Resposta", "1", "N"], ["Avaliacao", "AvaliacaoResumo", "1", "N"],
];

const camadas = [
  ["model", "Entidades JPA: Pessoa (abstrata, herança JOINED), Profissional, Responsavel, Aluno, Usuario, Empresa, Endereco, Telefone, Pais, Estado, Cidade. Lombok: @Getter, @Setter e @NoArgsConstructor (nunca @Data em entidades)."],
  ["enums", "TipoUsuarioEnum (ADMIN, PROFISSIONAL, RESPONSAVEL) e TipoServicoEnum (UMA_VEZ_SEMANA, DUAS_VEZES_SEMANA, DIARIA), gravados como texto com @Enumerated(EnumType.STRING)."],
  ["repository", "Uma interface Spring Data JPA por entidade (exceto Pessoa abstrata, que tem PessoaRepository para checagens de CPF). Consultas derivadas pelo nome do método, ex.: findByProfissionalIdOrderByNmPessoaAsc, existsByCpfAndIdNot."],
  ["dto", "Records separados por direção: XxxRequest (entrada, com Bean Validation) e XxxResponse (saída, com método estático de(...) que converte a entidade). Também ErroResponse, ErroValidacaoResponse, AtualizarUsuarioRequest e TransferirAlunoRequest."],
  ["service", "Regras de negócio: EmpresaService, GeografiaService, ProfissionalService, ResponsavelService, UsuarioService, AlunoService e AuthService. Recebem e devolvem DTOs; @Transactional nos métodos que alteram dados e @Transactional(readOnly = true) nas consultas."],
  ["controller", "Endpoints REST, sem regra de negócio: AuthController, GeografiaController, EmpresaController, ProfissionalController, ResponsavelController, UsuarioController, AlunoController. Permissões com @PreAuthorize."],
  ["security", "SecurityConfig (rotas públicas, stateless, resource server JWT, BCrypt, @EnableMethodSecurity), TokenService (gera o JWT HS256 no login), UserDetailsServiceImpl (busca o usuário pelo e-mail e bloqueia inativos), UsuarioLogado (lê usuarioId e perfil do token) e o record Solicitante (quem faz a requisição)."],
  ["exception", "RecursoNaoEncontradoException (404), ConflitoException (409), RequisicaoInvalidaException (400) e GlobalExceptionHandler (@RestControllerAdvice), que padroniza as respostas de erro, incluindo 401 de credenciais, 403 de acesso negado e 400 de validação por campo."],
  ["config", "AdminInicial (CommandLineRunner que cria o primeiro ADMIN a partir de ADMIN_EMAIL/ADMIN_SENHA) e OpenApiConfig (documentação Swagger com botão de autenticação por token)."],
];

const decisoes = [
  "Herança JPA do tipo JOINED: Profissional, Responsavel e Aluno estendem a classe abstrata Pessoa. Cada tabela filha usa o mesmo id da pessoa. Limitação aceita: a mesma pessoa não pode ter dois papéis.",
  "Pessoa primeiro, acesso depois: Profissional e Responsavel podem existir sem Usuario. O acesso é criado separadamente e o tipo do usuário é deduzido do tipo da pessoa; alunos não recebem acesso.",
  "Usuario é inativado (stAtivo = false), nunca excluído. O login de um usuário inativo é recusado.",
  "Vínculo aluno ↔ responsável é um @ManyToMany com @JoinTable no Aluno, usando Set para evitar duplicidade.",
  "Convenção de nomes: prefixos nm (nome), sg (sigla), dt (data), tp (tipo), nr (número), sn (senha), st (status). Colunas no banco em snake_case (nm_pessoa).",
  "JWT pelo suporte oficial do Spring (oauth2-resource-server): não há filtro JWT próprio; o TokenService apenas emite o token.",
  "Quem está chamando chega aos services como Solicitante (usuarioId + se é ADMIN), montado no controller a partir do token. O AlunoService usa isso para aplicar o isolamento por profissional e liberar o ADMIN.",
];

function gerarDot() {
  const linhas = (campos, estereotipo) => campos.map(([n, t]) =>
    `<TR><TD ALIGN="LEFT">${estereotipo === "enumeration" ? "" : "- "}${n}</TD><TD ALIGN="LEFT">${t ? ": " + t.replace(/</g, "&lt;").replace(/>/g, "&gt;") : ""}</TD></TR>`).join("");
  const classe = (nome, campos, estereotipo) => {
    const cab = estereotipo ? `<TR><TD COLSPAN="2"><I>&lt;&lt;${estereotipo}&gt;&gt;</I></TD></TR>` : "";
    const titulo = estereotipo === "abstract" ? `<I>${nome}</I>` : nome;
    return `"${nome}" [label=<<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="4">${cab}<TR><TD COLSPAN="2" BGCOLOR="#1F3864"><FONT COLOR="white"><B>${titulo}</B></FONT></TD></TR>${linhas(campos, estereotipo)}</TABLE>>];`;
  };
  let dot = `digraph Classes { rankdir=LR; graph [fontname="Helvetica", nodesep=0.45, ranksep=1.0, splines=ortho];
    node [shape=plain, fontname="Helvetica", fontsize=11]; edge [fontname="Helvetica", fontsize=10, color="#555555"];\n`;
  grupos.forEach((g, i) => {
    dot += `subgraph cluster_${i} { label="${g.nome}"; style=filled; color="${g.cor}"; fontname="Helvetica-Bold"; fontsize=13;\n`;
    g.classes.forEach(([n, c, e]) => { dot += classe(n, c, e) + "\n"; });
    dot += "}\n";
  });
  heranca.forEach(([filha, mae]) => { dot += `"${filha}" -> "${mae}" [arrowhead=onormal, arrowsize=1.2, color="#1F3864", penwidth=1.5];\n`; });
  associacoes.forEach(([a, b, ca, cb]) => { dot += `"${a}" -> "${b}" [arrowhead=none, taillabel="${ca}", headlabel="${cb}", labeldistance=1.6];\n`; });
  return dot + "}";
}

const celula = (texto, largura, { negrito = false, fundo, cor, fonte } = {}) => new TableCell({
  width: { size: largura, type: WidthType.DXA },
  shading: fundo ? { type: ShadingType.CLEAR, fill: fundo } : undefined,
  margins: { top: 80, bottom: 80, left: 100, right: 100 },
  children: [new Paragraph({ children: [new TextRun({ text: texto, bold: negrito, color: cor, font: fonte })] })],
});

function tabela(cabecalho, larguras, linhas) {
  return new Table({
    width: { size: larguras.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: larguras,
    rows: [
      new TableRow({ tableHeader: true, children: cabecalho.map((c, i) => celula(c, larguras[i], { negrito: true, fundo: HEADER_BG, cor: "FFFFFF" })) }),
      ...linhas.map((l, idx) => new TableRow({ children: l.map((v, i) => celula(v, larguras[i], { fundo: idx % 2 ? "F2F2F2" : undefined, fonte: i === 0 ? "Consolas" : undefined })) })),
    ],
  });
}

async function main() {
  const viz = await instance();
  const svg = viz.renderString(gerarDot(), { format: "svg" });
  const png = await sharp(Buffer.from(svg), { density: 200 }).png().toBuffer();
  const { width, height } = await sharp(png).metadata();
  const larguraImg = 620;

  const h1 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 150 } });
  const p = (t) => new Paragraph({ children: [new TextRun(t)], spacing: { after: 120 } });
  const bullet = (t) => new Paragraph({ text: t, bullet: { level: 0 }, spacing: { after: 60 } });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "Impulso", bold: true, size: 44, color: HEADER_BG })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "Plano de Classes", size: 30 })] }),
        p("Este documento descreve as classes de domínio do Impulso e a organização do backend (Spring Boot 4, Java 17) em pacotes. Ele reflete o código implementado na Fase 1; as classes do módulo de avaliação aparecem como planejadas para a Fase 2."),
        h1("1. Diagrama de Classes de Domínio"),
        p("Setas com triângulo vazado indicam herança (Profissional, Responsavel e Aluno são Pessoa). As demais linhas são associações, com a cardinalidade em cada ponta."),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
          new ImageRun({ data: png, type: "png", transformation: { width: larguraImg, height: height * (larguraImg / width) } }),
        ] }),
        h1("2. Organização em Pacotes"),
        p("Base: com.impulso. O fluxo de uma requisição é controller → service → repository → model, com o pacote security atuando antes de qualquer controller."),
        tabela(["Pacote", "Conteúdo e responsabilidade"], [1900, 7600], camadas),
        h1("3. Decisões de Modelagem"),
        ...decisoes.map(bullet),
      ],
    }],
  });

  fs.writeFileSync(SAIDA, await Packer.toBuffer(doc));
  console.log("OK: " + SAIDA);
}

main().catch((e) => { console.error(e); process.exit(1); });
