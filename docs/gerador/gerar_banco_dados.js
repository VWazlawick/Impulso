// Uso: node gerar_banco_dados.js  (gera ../Planejamento_Banco_de_Dados.docx a partir de ../../db/schema.sql)
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { instance } = require("@viz-js/viz");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  AlignmentType, ShadingType, Table, TableRow, TableCell, WidthType, BorderStyle
} = require("docx");

const HEADER_BG = "1F3864";
const SCHEMA = path.join(__dirname, "..", "..", "db", "schema.sql");
const SAIDA = path.join(__dirname, "..", "Planejamento_Banco_de_Dados.docx");

const grupos = [
  { nome: "Geografia (referência)", cor: "#EDEDED", tabelas: [
    ["Pais", [["id", "int", "pk"], ["nome", "String"], ["sigla", "String"]]],
    ["Estado", [["id", "int", "pk"], ["nome", "String"], ["sigla", "String"], ["pais_id", "int", "fk"]]],
    ["Cidade", [["id", "int", "pk"], ["nome", "String"], ["estado_id", "int", "fk"]]],
  ]},
  { nome: "Pessoas e Acesso", cor: "#E2EFDA", tabelas: [
    ["Usuario", [["id", "int", "pk"], ["email", "String"], ["sn_usuario", "String"], ["tp_usuario", "TipoUsuarioEnum"]]],
    ["Profissional", [["id", "int", "pk"], ["nome", "String"], ["cpf", "String"], ["usuario_id", "int", "fk"], ["empresa_id", "int", "fk"]]],
    ["Responsavel", [["id", "int", "pk"], ["nome", "String"], ["cpf", "String"], ["usuario_id", "int", "fk"]]],
    ["Empresa", [["id", "int", "pk"], ["razao_social", "String"], ["cnpj", "String"]]],
  ]},
  { nome: "Aluno", cor: "#FFF2CC", tabelas: [
    ["Aluno", [["id", "int", "pk"], ["nome", "String"], ["cpf", "String"], ["email", "String"], ["data_nascimento", "Date"], ["tp_servico", "TipoServicoEnum"], ["profissional_id", "int", "fk"]]],
    ["Endereco", [["id", "int", "pk"], ["rua", "String"], ["numero", "String"], ["bairro", "String"], ["cep", "String"], ["complemento", "String"], ["tipo", "String"], ["cidade_id", "int", "fk"], ["aluno_id", "int", "fk"]]],
    ["Telefone", [["id", "int", "pk"], ["numero", "String"], ["tipo", "String"], ["aluno_id", "int", "fk"]]],
    ["AlunoResponsavel", [["aluno_id", "int", "pk"], ["responsavel_id", "int", "pk"]]],
  ]},
  { nome: "Avaliação", cor: "#DDEBF7", tabelas: [
    ["Questionario", [["id", "int", "pk"], ["nome", "String"], ["idade_min", "int"], ["idade_max", "int"]]],
    ["Pergunta", [["id", "int", "pk"], ["enunciado", "String"], ["tipo", "TipoPerguntaEnum"], ["unidade", "String"], ["categoria", "String"], ["indice", "int"], ["questionario_id", "int", "fk"]]],
    ["OpcaoPergunta", [["id", "int", "pk"], ["texto", "String"], ["ordem", "int"], ["pergunta_id", "int", "fk"]]],
    ["Avaliacao", [["id", "int", "pk"], ["data", "Date"], ["aluno_id", "int", "fk"], ["profissional_id", "int", "fk"], ["questionario_id", "int", "fk"]]],
    ["Resposta", [["id", "int", "pk"], ["valor", "String"], ["avaliacao_id", "int", "fk"], ["pergunta_id", "int", "fk"]]],
    ["AvaliacaoResumo", [["id", "int", "pk"], ["categoria", "String"], ["score", "double"], ["avaliacao_id", "int", "fk"]]],
  ]},
];

const relacoes = [
  ["Pais", "Estado"], ["Estado", "Cidade"], ["Cidade", "Endereco"],
  ["Usuario", "Profissional", "1"], ["Usuario", "Responsavel", "1"], ["Empresa", "Profissional"],
  ["Profissional", "Aluno"], ["Aluno", "Endereco"], ["Aluno", "Telefone"],
  ["Aluno", "AlunoResponsavel"], ["Responsavel", "AlunoResponsavel"],
  ["Questionario", "Pergunta"], ["Pergunta", "OpcaoPergunta"],
  ["Aluno", "Avaliacao"], ["Profissional", "Avaliacao"], ["Questionario", "Avaliacao"],
  ["Avaliacao", "Resposta"], ["Pergunta", "Resposta"], ["Avaliacao", "AvaliacaoResumo"],
];

const notas = [
  ["Geografia (Pais, Estado, Cidade)", "Dados de referência, cadastrados previamente e somente leitura para Profissional/Responsável. Usados no preenchimento de Endereco."],
  ["Usuario / Profissional / Responsavel", "Usuario concentra e-mail, senha e o tipo de acesso (ADMIN, PROFISSIONAL, RESPONSAVEL). Profissional e Responsavel guardam dados pessoais específicos e se relacionam 1:1 com Usuario."],
  ["Aluno", "Pertence a um Profissional responsável pelo cadastro. tp_servico guarda a frequência semanal contratada (enum simples, sem depender de Aula/Contrato, que ficam para uma fase futura)."],
  ["AlunoResponsavel", "Tabela associativa N:N — um aluno pode ter mais de um responsável e vice-versa."],
  ["Questionario / Pergunta / OpcaoPergunta", "Questionario representa o conjunto de perguntas de uma faixa etária (idade_min/idade_max, a preencher quando definido). Pergunta suporta 5 tipos (múltipla escolha, verdadeiro/falso, escala, texto livre, medida numérica), com unidade, categoria e índice para refletir a organização real da ficha de avaliação."],
  ["Avaliacao", "Guarda qual Questionario foi utilizado (snapshot), não apenas a idade do aluno na data — assim o histórico não muda se as faixas etárias forem editadas depois."],
  ["Resposta", "Uma linha por Pergunta respondida em uma Avaliacao. O campo valor é genérico (String) porque o tipo de dado varia conforme o tipo da Pergunta."],
  ["AvaliacaoResumo", "Score agregado por categoria/habilidade, calculado e armazenado no momento em que as respostas do checklist são salvas — não é recalculado sob demanda, para manter o relatório de evolução estável."],
  ["Enums (tipo, tp_servico, tipo da pergunta)", "Armazenados como VARCHAR com restrição CHECK, e não como ENUM nativo do PostgreSQL: o banco continua recusando valores inválidos, o JPA mapeia com @Enumerated(EnumType.STRING) sem configuração extra, e incluir um valor novo exige apenas alterar a restrição."],
];

function gerarDot() {
  const tabela = (nome, campos) => {
    const linhas = campos.map(([n, t, k]) =>
      `<TR><TD ALIGN="LEFT">${k === "pk" ? "<B>PK</B> " : k === "fk" ? "<I>FK</I> " : ""}${n}</TD><TD ALIGN="LEFT">${t}</TD></TR>`).join("");
    return `"${nome}" [label=<<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="4"><TR><TD COLSPAN="2" BGCOLOR="#1F3864"><FONT COLOR="white"><B>${nome}</B></FONT></TD></TR>${linhas}</TABLE>>];`;
  };
  let dot = `digraph ER { rankdir=LR; graph [fontname="Helvetica", nodesep=0.4, ranksep=0.9, splines=ortho];
    node [shape=plain, fontname="Helvetica", fontsize=11]; edge [fontname="Helvetica", fontsize=10, color="#555555", arrowsize=0.7];\n`;
  grupos.forEach((g, i) => {
    dot += `subgraph cluster_${i} { label="${g.nome}"; style=filled; color="${g.cor}"; fontname="Helvetica-Bold"; fontsize=13;\n`;
    g.tabelas.forEach(([n, c]) => { dot += tabela(n, c) + "\n"; });
    dot += "}\n";
  });
  relacoes.forEach(([a, b, card]) => { dot += `"${a}" -> "${b}" [taillabel="1", headlabel="${card || "N"}", labeldistance=1.6];\n`; });
  return dot + "}";
}

const celula = (texto, largura, { negrito = false, fundo, cor } = {}) => new TableCell({
  width: { size: largura, type: WidthType.DXA },
  shading: fundo ? { type: ShadingType.CLEAR, fill: fundo } : undefined,
  margins: { top: 80, bottom: 80, left: 100, right: 100 },
  children: [new Paragraph({ children: [new TextRun({ text: texto, bold: negrito, color: cor })] })],
});

function blocoCodigo(linhas) {
  const borda = { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" };
  return new Table({
    width: { size: 9500, type: WidthType.DXA },
    columnWidths: [9500],
    borders: { top: borda, bottom: borda, left: borda, right: borda },
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9500, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: "F5F5F5" },
      margins: { top: 150, bottom: 150, left: 200, right: 200 },
      children: linhas.map((l) => new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: l || " ", font: "Consolas", size: 18 })] })),
    })] })],
  });
}

async function main() {
  const viz = await instance();
  const svg = viz.renderString(gerarDot(), { format: "svg" });
  const png = await sharp(Buffer.from(svg), { density: 220 }).png().toBuffer();
  const { width, height } = await sharp(png).metadata();
  const larguraImg = 620;

  const ddl = fs.readFileSync(SCHEMA, "utf8").replace(/\r\n/g, "\n").trimEnd().split("\n");

  const tabelaNotas = new Table({
    width: { size: 9500, type: WidthType.DXA },
    columnWidths: [2600, 6900],
    rows: [
      new TableRow({ tableHeader: true, children: [
        celula("Entidade(s)", 2600, { negrito: true, fundo: HEADER_BG, cor: "FFFFFF" }),
        celula("Observações", 6900, { negrito: true, fundo: HEADER_BG, cor: "FFFFFF" }),
      ] }),
      ...notas.map(([n, o], i) => new TableRow({ children: [
        celula(n, 2600, { negrito: true, fundo: i % 2 ? "F2F2F2" : undefined }),
        celula(o, 6900, { fundo: i % 2 ? "F2F2F2" : undefined }),
      ] })),
    ],
  });

  const h1 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 150 } });
  const p = (t) => new Paragraph({ children: [new TextRun(t)], spacing: { after: 120 } });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "Impulso", bold: true, size: 44, color: HEADER_BG })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "Planejamento de Banco de Dados", size: 30 })] }),
        p("Este documento apresenta o modelo de dados do sistema Impulso: o diagrama de entidade-relacionamento, notas sobre as principais decisões de modelagem e o script DDL completo para PostgreSQL. O script também está no repositório, em db/schema.sql, que é a fonte oficial."),
        h1("1. Diagrama de Entidade-Relacionamento"),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
          new ImageRun({ data: png, type: "png", transformation: { width: larguraImg, height: height * (larguraImg / width) } }),
        ] }),
        h1("2. Notas de Modelagem por Entidade"),
        tabelaNotas,
        h1("3. Script DDL (PostgreSQL)"),
        p("Conteúdo de db/schema.sql: criação das tabelas, restrições e índices de apoio."),
        blocoCodigo(ddl),
      ],
    }],
  });

  fs.writeFileSync(SAIDA, await Packer.toBuffer(doc));
  console.log("OK: " + SAIDA);
}

main().catch((e) => { console.error(e); process.exit(1); });
