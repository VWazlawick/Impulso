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
    ["Pais", [["id", "int", "pk"], ["nm_pais", "String"], ["sg_pais", "String"]]],
    ["Estado", [["id", "int", "pk"], ["nm_estado", "String"], ["sg_estado", "String"], ["pais_id", "int", "fk"]]],
    ["Cidade", [["id", "int", "pk"], ["nm_cidade", "String"], ["cd_ibge", "long"], ["estado_id", "int", "fk"]]],
  ]},
  { nome: "Pessoas e Acesso", cor: "#E2EFDA", tabelas: [
    ["Usuario", [["id", "int", "pk"], ["email", "String"], ["sn_usuario", "String"], ["tp_usuario", "TipoUsuarioEnum"], ["st_ativo", "boolean"]]],
    ["Pessoa", [["id", "int", "pk"], ["nm_pessoa", "String"], ["cpf", "String"], ["email", "String"]]],
    ["Profissional", [["id", "int", "pkfk"], ["usuario_id", "int", "fk"], ["empresa_id", "int", "fk"]]],
    ["Responsavel", [["id", "int", "pkfk"], ["nr_telefone", "String"], ["usuario_id", "int", "fk"]]],
    ["Empresa", [["id", "int", "pk"], ["razao_social", "String"], ["cnpj", "String"]]],
  ]},
  { nome: "Aluno", cor: "#FFF2CC", tabelas: [
    ["Aluno", [["id", "int", "pkfk"], ["dt_nascimento", "Date"], ["tp_servico", "TipoServicoEnum"], ["tp_sexo", "SexoEnum"], ["vl_peso", "decimal"], ["vl_estatura", "decimal"], ["vl_cintura", "decimal"], ["st_ativo", "boolean"], ["profissional_id", "int", "fk"]]],
    ["Endereco", [["id", "int", "pk"], ["rua", "String"], ["nr_casa", "String"], ["bairro", "String"], ["cep", "String"], ["complemento", "String"], ["cidade_id", "int", "fk"], ["aluno_id", "int", "fk"]]],
    ["AlunoResponsavel", [["aluno_id", "int", "pk"], ["responsavel_id", "int", "pk"]]],
  ]},
  { nome: "Avaliação", cor: "#DDEBF7", tabelas: [
    ["Grupo", [["id", "int", "pk"], ["nm_grupo", "String"], ["nr_idade_min", "int"], ["nr_idade_max", "int"]]],
    ["Subgrupo", [["id", "int", "pk"], ["nm_subgrupo", "String"], ["tp_calculo", "TipoCalculoEnum"], ["nr_ordem", "int"], ["grupo_id", "int", "fk"]]],
    ["Pergunta", [["id", "int", "pk"], ["ds_pergunta", "String"], ["tp_resposta", "TipoRespostaEnum"], ["ds_unidade", "String"], ["nr_ordem", "int"], ["subgrupo_id", "int", "fk"]]],
    ["Avaliacao", [["id", "int", "pk"], ["dt_avaliacao", "Date"], ["vl_peso", "decimal"], ["vl_estatura", "decimal"], ["vl_cintura", "decimal"], ["aluno_id", "int", "fk"], ["profissional_id", "int", "fk"], ["grupo_id", "int", "fk"]]],
    ["Resposta", [["id", "int", "pk"], ["vl_resposta", "decimal"], ["tp_opcao", "TipoOpcaoEnum"], ["avaliacao_id", "int", "fk"], ["pergunta_id", "int", "fk"]]],
    ["AvaliacaoResumo", [["id", "int", "pk"], ["vl_resultado", "decimal"], ["tp_estagio", "EstagioEnum"], ["avaliacao_id", "int", "fk"], ["subgrupo_id", "int", "fk"]]],
    ["Classificacao", [["id", "int", "pk"], ["tp_indicador", "TipoIndicadorEnum"], ["subgrupo_id", "int", "fk"], ["tp_sexo", "SexoEnum"], ["nr_idade_min", "int"], ["nr_idade_max", "int"], ["vl_inicio", "decimal"], ["ds_classificacao", "String"]]],
  ]},
];

const relacoes = [
  ["Pais", "Estado"], ["Estado", "Cidade"], ["Cidade", "Endereco"],
  ["Usuario", "Profissional", "1"], ["Usuario", "Responsavel", "1"], ["Empresa", "Profissional"],
  ["Pessoa", "Profissional", "1"], ["Pessoa", "Responsavel", "1"], ["Pessoa", "Aluno", "1"],
  ["Aluno", "Endereco"],
  ["Profissional", "Aluno"],
  ["Aluno", "AlunoResponsavel"], ["Responsavel", "AlunoResponsavel"],
  ["Grupo", "Subgrupo"], ["Subgrupo", "Pergunta"],
  ["Aluno", "Avaliacao"], ["Profissional", "Avaliacao"], ["Grupo", "Avaliacao"],
  ["Avaliacao", "Resposta"], ["Pergunta", "Resposta"], ["Avaliacao", "AvaliacaoResumo"], ["Subgrupo", "AvaliacaoResumo"], ["Subgrupo", "Classificacao"],
];

const notas = [
  ["Geografia (Pais, Estado, Cidade)", "Dados de referência importados da API do IBGE na primeira inicialização e somente leitura pela API. cd_ibge guarda o código do município no IBGE, usado para casar o resultado da busca de CEP (ViaCEP) com a cidade."],
  ["Pessoa (herança)", "Dados comuns de Profissional, Responsavel e Aluno (nome, CPF, e-mail de contato), mapeados com herança JPA do tipo JOINED: cada tabela filha usa como chave primária o próprio id da pessoa (PK e FK ao mesmo tempo). CPF é opcional na tabela: o aluno pode não ter e o responsável não usa; para profissional a obrigatoriedade é validada na aplicação. Limitação aceita: uma mesma pessoa não pode ter dois papéis."],
  ["Usuario / Profissional / Responsavel", "Usuario concentra e-mail de login, senha e o tipo de acesso (ADMIN, PROFISSIONAL, RESPONSAVEL). A pessoa é cadastrada primeiro e o acesso é criado depois, por isso usuario_id é opcional em Profissional e Responsavel. Inativar um usuário marca st_ativo = false: o login passa a ser recusado e o histórico é preservado."],
  ["Responsavel", "Cadastro enxuto: nome (em pessoa) e um telefone (nr_telefone, DDD + número). É cadastrado dentro do aluno e já nasce vinculado a ele."],
  ["Aluno", "Pertence a um Profissional responsável pelo cadastro. tp_servico (obrigatório) guarda a frequência semanal contratada: UMA_VEZ_SEMANA, DUAS_VEZES_SEMANA ou DIARIA — enum simples, sem depender de Aula/Contrato, que ficam para uma fase futura. tp_sexo (MASCULINO/FEMININO) é usado pelas faixas de classificação. vl_peso (kg), vl_estatura (cm) e vl_cintura (cm) são opcionais e guardam as medidas mais recentes: preenchem a ficha da próxima avaliação e são atualizadas quando uma avaliação mais nova é registrada ou corrigida. Inativar marca st_ativo = false: o aluno sai da lista padrão e não recebe avaliação nova, mas o histórico continua consultável."],
  ["Endereco", "Pertence ao aluno (um ou mais, ex.: pais separados). Rua, bairro e cidade podem vir da busca de CEP."],
  ["Documentos e siglas", "CPF (11), CNPJ (14), CEP (8) e siglas de país/estado (2) são gravados só com dígitos/letras, sem pontuação. A formatação para exibição fica a cargo da interface."],
  ["Convenção de nomes", "Colunas seguem os prefixos do código Java convertidos para snake_case: nm_ (nome), sg_ (sigla), dt_ (data), tp_ (tipo), nr_ (número), sn_ (senha), st_ (status), ds_ (descrição), cd_ (código), vl_ (valor)."],
  ["AlunoResponsavel", "Tabela associativa N:N — um aluno pode ter mais de um responsável e vice-versa."],
  ["Grupo / Subgrupo / Pergunta", "Estrutura da ficha, cadastrável pelo ADMIN. O grupo tem a faixa etária (nr_idade_min/nr_idade_max) e as faixas não se sobrepõem, então a idade do aluno aponta para um único grupo. O subgrupo (ex.: um teste ou uma habilidade) define o tp_calculo do resultado; a pergunta tem o tipo de resposta (NUMERO ou SIM_NAO_PARCIAL). O conteúdo pode ser licenciado: fica só no banco da instância, nunca no repositório."],
  ["Avaliacao", "Guarda o grupo usado (escolhido pela idade do aluno na data) e o profissional responsável naquele momento — assim o histórico não muda se as faixas forem editadas ou o aluno for transferido depois. Também guarda as medidas do dia (peso, estatura e cintura); o IMC e a RCE são calculados a partir delas na consulta, sem coluna própria."],
  ["Resposta", "Uma linha por pergunta respondida: vl_resposta (número) ou tp_opcao (SIM/NAO/PARCIAL), conforme o tipo da pergunta. Perguntas sem resposta são permitidas (teste não realizado)."],
  ["AvaliacaoResumo", "Resultado de cada subgrupo, calculado e gravado ao salvar a avaliação e recalculado ao editar: melhor tentativa (vl_resultado) ou estágio motor (tp_estagio: INICIAL, ELEMENTAR, MADURO)."],
  ["Classificacao", "Faixas das tabelas de referência, cadastradas pelo ADMIN (o conteúdo pode ser licenciado e fica só no banco da instância). Cada linha vale para um sexo e uma faixa de idade e diz: a partir de vl_inicio, o resultado recebe ds_classificacao. Vale a faixa de maior vl_inicio que não passa do valor, o que funciona tanto para maior-é-melhor quanto para menor-é-melhor e não deixa buracos entre faixas. tp_indicador SUBGRUPO aponta para um subgrupo de resultado numérico; IMC e RCE não têm subgrupo (CHECK garante a combinação). A classificação é calculada na consulta, então corrigir uma faixa vale também para as avaliações antigas."],
  ["Enums (tp_usuario, tp_servico, tp_sexo, tp_calculo, tp_resposta, tp_opcao, tp_estagio, tp_indicador)", "Armazenados como VARCHAR com restrição CHECK, e não como ENUM nativo do PostgreSQL: o banco continua recusando valores inválidos, o JPA mapeia com @Enumerated(EnumType.STRING) sem configuração extra, e incluir um valor novo exige apenas alterar a restrição."],
];

function gerarDot() {
  const tabela = (nome, campos) => {
    const linhas = campos.map(([n, t, k]) =>
      `<TR><TD ALIGN="LEFT">${k === "pkfk" ? "<B>PK</B> <I>FK</I> " : k === "pk" ? "<B>PK</B> " : k === "fk" ? "<I>FK</I> " : ""}${n}</TD><TD ALIGN="LEFT">${t}</TD></TR>`).join("");
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
  const svg = viz.renderString(gerarDot(), { format: "svg" })
    .replace(/font-family="Helvetica,sans-Serif"/g, 'font-family="Arial"'); // Helvetica não existe no Windows; Arial tem as mesmas medidas
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
