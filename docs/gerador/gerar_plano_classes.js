// Uso: node gerar_plano_classes.js [saida.docx]  (padrão: ../Plano_de_Classes.docx)
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

// Diagrama 1: cadastros (Fase 1)
const cadastros = {
  grupos: [
    { nome: "Geografia (referência)", cor: "#EDEDED", classes: [
      ["Pais", [["id", "Long"], ["nmPais", "String"], ["sgPais", "String"]]],
      ["Estado", [["id", "Long"], ["nmEstado", "String"], ["sgEstado", "String"], ["pais", "Pais"]]],
      ["Cidade", [["id", "Long"], ["nmCidade", "String"], ["cdIbge", "Long"], ["estado", "Estado"]]],
    ]},
    { nome: "Pessoas e Acesso", cor: "#E2EFDA", classes: [
      ["Pessoa", [["id", "Long"], ["nmPessoa", "String"], ["cpf", "String"], ["email", "String"]], "abstract"],
      ["Profissional", [["usuario", "Usuario"], ["empresa", "Empresa"]]],
      ["Responsavel", [["nrTelefone", "String"], ["usuario", "Usuario"]]],
      ["Usuario", [["id", "Long"], ["email", "String"], ["snUsuario", "String"], ["stAtivo", "boolean"], ["tpUsuario", "TipoUsuarioEnum"]]],
      ["Empresa", [["id", "Long"], ["razaoSocial", "String"], ["cnpj", "String"]]],
      ["TipoUsuarioEnum", [["ADMIN", ""], ["PROFISSIONAL", ""], ["RESPONSAVEL", ""]], "enumeration"],
    ]},
    { nome: "Aluno", cor: "#FFF2CC", classes: [
      ["Aluno", [["dtNascimento", "LocalDate"], ["tpServico", "TipoServicoEnum"], ["sexo", "SexoEnum"], ["vlPeso", "BigDecimal"], ["vlEstatura", "BigDecimal"], ["vlCintura", "BigDecimal"], ["profissional", "Profissional"], ["responsaveis", "Set<Responsavel>"]]],
      ["Endereco", [["id", "Long"], ["rua", "String"], ["nrCasa", "String"], ["bairro", "String"], ["cep", "String"], ["complemento", "String"], ["cidade", "Cidade"], ["aluno", "Aluno"]]],
      ["TipoServicoEnum", [["UMA_VEZ_SEMANA", ""], ["DUAS_VEZES_SEMANA", ""], ["DIARIA", ""]], "enumeration"],
      ["SexoEnum", [["MASCULINO", ""], ["FEMININO", ""]], "enumeration"],
    ]},
  ],
  heranca: [["Profissional", "Pessoa"], ["Responsavel", "Pessoa"], ["Aluno", "Pessoa"]],
  associacoes: [
    ["Pais", "Estado", "1", "N"], ["Estado", "Cidade", "1", "N"], ["Cidade", "Endereco", "1", "N"],
    ["Aluno", "Endereco", "1", "N"],
    ["Usuario", "Profissional", "0..1", "0..1"], ["Usuario", "Responsavel", "0..1", "0..1"],
    ["Empresa", "Profissional", "1", "N"], ["Profissional", "Aluno", "1", "N"],
    ["Aluno", "Responsavel", "N", "N"],
  ],
  composicoes: [],
  splines: "spline",
};

// Diagrama 2: avaliação e classificação (Fases 2 e 3)
const avaliacao = {
  grupos: [
    { nome: "Estrutura da ficha (cadastrada pelo ADMIN)", cor: "#DDEBF7", classes: [
      ["Grupo", [["id", "Long"], ["nmGrupo", "String"], ["nrIdadeMin", "Integer"], ["nrIdadeMax", "Integer"], ["subgrupos", "List<Subgrupo>"]]],
      ["Subgrupo", [["id", "Long"], ["nmSubgrupo", "String"], ["tpCalculo", "TipoCalculoEnum"], ["nrOrdem", "Integer"], ["grupo", "Grupo"], ["perguntas", "List<Pergunta>"]]],
      ["Pergunta", [["id", "Long"], ["dsPergunta", "String"], ["tpResposta", "TipoRespostaEnum"], ["dsUnidade", "String"], ["nrOrdem", "Integer"], ["subgrupo", "Subgrupo"]]],
      ["TipoCalculoEnum", [["NENHUM", ""], ["MAIOR_VALOR", ""], ["MENOR_VALOR", ""], ["ESTAGIO", ""], ["aceita(TipoRespostaEnum)", "boolean"], ["resultadoNumerico()", "boolean"]], "enumeration"],
      ["TipoRespostaEnum", [["NUMERO", ""], ["SIM_NAO_PARCIAL", ""]], "enumeration"],
    ]},
    { nome: "Avaliação (registrada pelo profissional)", cor: "#E2EFDA", classes: [
      ["Avaliacao", [["id", "Long"], ["dtAvaliacao", "LocalDate"], ["vlPeso", "BigDecimal"], ["vlEstatura", "BigDecimal"], ["vlCintura", "BigDecimal"], ["aluno", "Aluno"], ["profissional", "Profissional"], ["grupo", "Grupo"], ["respostas", "List<Resposta>"], ["resumos", "List<AvaliacaoResumo>"], ["calcularIdade()", "int"], ["calcularImc()", "BigDecimal"], ["calcularRce()", "BigDecimal"]]],
      ["Resposta", [["id", "Long"], ["vlResposta", "BigDecimal"], ["tpOpcao", "TipoOpcaoEnum"], ["avaliacao", "Avaliacao"], ["pergunta", "Pergunta"]]],
      ["AvaliacaoResumo", [["id", "Long"], ["vlResultado", "BigDecimal"], ["tpEstagio", "EstagioEnum"], ["avaliacao", "Avaliacao"], ["subgrupo", "Subgrupo"]]],
      ["TipoOpcaoEnum", [["SIM", ""], ["NAO", ""], ["PARCIAL", ""]], "enumeration"],
      ["EstagioEnum", [["INICIAL", ""], ["ELEMENTAR", ""], ["MADURO", ""]], "enumeration"],
    ]},
    { nome: "Classificação (cadastrada pelo ADMIN)", cor: "#EAE0F5", classes: [
      ["Classificacao", [["id", "Long"], ["tpIndicador", "TipoIndicadorEnum"], ["subgrupo", "Subgrupo"], ["tpSexo", "SexoEnum"], ["nrIdadeMin", "Integer"], ["nrIdadeMax", "Integer"], ["vlInicio", "BigDecimal"], ["dsClassificacao", "String"]]],
      ["TipoIndicadorEnum", [["SUBGRUPO", ""], ["IMC", ""], ["RCE", ""]], "enumeration"],
    ]},
    { nome: "Cadastros (ver diagrama 1)", cor: "#FFF2CC", classes: [
      ["Aluno", [["...", ""]]],
      ["Profissional", [["...", ""]]],
    ]},
  ],
  heranca: [],
  associacoes: [
    ["Grupo", "Subgrupo", "1", "N"], ["Subgrupo", "Pergunta", "1", "N"],
    ["Grupo", "Avaliacao", "1", "N"], ["Aluno", "Avaliacao", "1", "N"], ["Profissional", "Avaliacao", "1", "N"],
    ["Pergunta", "Resposta", "1", "N"], ["Subgrupo", "AvaliacaoResumo", "1", "N"],
    ["Subgrupo", "Classificacao", "0..1", "N"],
  ],
  composicoes: [["Avaliacao", "Resposta", "1", "N"], ["Avaliacao", "AvaliacaoResumo", "1", "N"]],
};

const camadas = [
  ["model", "Entidades JPA. Cadastros: Pessoa (abstrata, herança JOINED), Profissional, Responsavel, Aluno, Usuario, Empresa, Endereco, Pais, Estado, Cidade. Avaliação: Grupo, Subgrupo, Pergunta, Avaliacao (com calcularIdade, calcularImc e calcularRce), Resposta, AvaliacaoResumo. Classificação: Classificacao (faixas das tabelas de referência). Lombok: @Getter, @Setter e @NoArgsConstructor (nunca @Data em entidades)."],
  ["enums", "TipoUsuarioEnum, TipoServicoEnum, SexoEnum, TipoCalculoEnum (com o método aceita, que diz se um tipo de pergunta combina com o cálculo, e o resultadoNumerico), TipoRespostaEnum, TipoOpcaoEnum, EstagioEnum e TipoIndicadorEnum (SUBGRUPO, IMC ou RCE). Gravados como texto com @Enumerated(EnumType.STRING)."],
  ["repository", "Interfaces Spring Data JPA. Consultas derivadas pelo nome do método (findByProfissionalIdOrderByNmPessoaAsc, existsByPerguntaSubgrupoId...) e @Query em JPQL quando o nome ficaria ilegível (existeSobreposicao e buscarPorIdade no GrupoRepository, buscarDoProfissional no ResponsavelRepository). AvaliacaoResumo não tem repositório: é salvo e apagado junto com a Avaliacao. No ClassificacaoRepository, uma única consulta derivada serve para listar, achar faixas repetidas e classificar; passar o subgrupo null gera subgrupo is null, que encontra as faixas de IMC e RCE."],
  ["dto", "Records por direção: XxxRequest (entrada, com Bean Validation, inclusive em listas com List<@Valid ...>) e XxxResponse (saída, com método estático de(...)). Versões resumida e detalhada quando faz sentido: GrupoResponse e GrupoDetalheResponse (árvore subgrupos > perguntas), AvaliacaoListaResponse e AvaliacaoResponse. FichaResponse reaproveita o GrupoDetalheResponse. MedidasResponse agrupa as medidas, o IMC, a RCE e as classificações, e os records Evolucao* montam o relatório. Os construtores do AlunoRequest e do AvaliacaoRequest convertem estatura e cintura em metros para centímetros antes da validação."],
  ["service", "Regras de negócio: EmpresaService, GeografiaService, ProfissionalService, ResponsavelService, UsuarioService, AlunoService, EnderecoService, CepService, AuthService, GrupoService, SubgrupoService, PerguntaService, AvaliacaoService, EvolucaoService e ClassificacaoService (cadastro das faixas e cálculo da classificação). CalculadoraResultado (@Component) concentra as regras de cálculo: melhor tentativa e estágio motor. @Transactional nos métodos que alteram dados e @Transactional(readOnly = true) nas consultas."],
  ["controller", "Endpoints REST, sem regra de negócio: AuthController, GeografiaController, EmpresaController, ProfissionalController, ResponsavelController, UsuarioController, AlunoController, EnderecoController, CepController, GrupoController, SubgrupoController, PerguntaController, AvaliacaoController, EvolucaoController e ClassificacaoController. Permissões com @PreAuthorize na classe e, quando precisa, no método, como nas consultas de aluno e de avaliação liberadas ao RESPONSAVEL."],
  ["security", "SecurityConfig (rotas públicas, stateless, resource server JWT, BCrypt, @EnableMethodSecurity), TokenService (gera o JWT HS256 no login), UserDetailsServiceImpl (busca o usuário pelo e-mail e bloqueia inativos), UsuarioLogado (lê usuarioId e perfil do token) e o record Solicitante (quem faz a requisição: usuarioId e se é ADMIN ou RESPONSAVEL)."],
  ["exception", "RecursoNaoEncontradoException (404), ConflitoException (409), RequisicaoInvalidaException (400), ServicoIndisponivelException (503) e GlobalExceptionHandler (@RestControllerAdvice), que padroniza as respostas de erro, incluindo 401 de credenciais, 403 de acesso negado e 400 de validação por campo."],
  ["integracao", "Clientes de APIs externas com RestClient: IbgeClient (estados e municípios, usado na carga inicial) e ViaCepClient (busca de CEP, com timeouts de conexão e leitura). Os records IbgeEstado, IbgeMunicipio e ViaCepEndereco traduzem o JSON externo com @JsonProperty."],
  ["utils", "ConversorMedida: converte para centímetros a estatura e a cintura digitadas em metros (valor abaixo de 3); usado pelos records de requisição."],
  ["config", "AdminInicial (CommandLineRunner que cria o primeiro ADMIN a partir de ADMIN_EMAIL/ADMIN_SENHA), GeografiaInicial (CommandLineRunner que importa país, estados e cidades do IBGE quando as tabelas estão vazias) e OpenApiConfig (documentação Swagger com botão de autenticação por token)."],
];

const decisoes = [
  "Herança JPA do tipo JOINED: Profissional, Responsavel e Aluno estendem a classe abstrata Pessoa. Cada tabela filha usa o mesmo id da pessoa. Limitação aceita: a mesma pessoa não pode ter dois papéis. O Responsavel usa só o nome da Pessoa (sem CPF e e-mail).",
  "Pessoa primeiro, acesso depois: Profissional e Responsavel podem existir sem Usuario. O acesso é criado separadamente e o tipo do usuário é deduzido do tipo da pessoa; alunos não recebem acesso.",
  "Usuario é inativado (stAtivo = false), nunca excluído. O login de um usuário inativo é recusado.",
  "Responsável é um cadastro enxuto (nome e um telefone), cadastrado dentro do aluno. Endereços pertencem ao aluno. O vínculo aluno ↔ responsável é um @ManyToMany com @JoinTable no Aluno, usando Set para evitar duplicidade.",
  "Convenção de nomes: prefixos nm (nome), sg (sigla), dt (data), tp (tipo), nr (número), sn (senha), st (status), ds (descrição), cd (código), vl (valor). Colunas no banco em snake_case (nm_pessoa).",
  "JWT pelo suporte oficial do Spring (oauth2-resource-server): não há filtro JWT próprio; o TokenService apenas emite o token.",
  "Quem está chamando chega aos services como Solicitante (usuarioId + se é ADMIN ou RESPONSAVEL), montado no controller a partir do token. Os services usam isso para isolar os dados por profissional (alunos, endereços, responsáveis e avaliações) e por responsável (só os filhos), e para liberar o ADMIN. O que não pertence a quem pediu responde 404, sem revelar que existe.",
  "Estrutura da ficha cadastrável (Grupo > Subgrupo > Pergunta), em vez de um questionário fixo no código. As listas usam @OneToMany(mappedBy) com @OrderBy, e a árvore é montada só navegando pelos getters. O conteúdo das fichas pode ser licenciado: fica no banco da instância, nunca no código.",
  "Avaliação como um agregado: Resposta e AvaliacaoResumo usam cascade ALL e orphanRemoval, então são salvas e apagadas junto com a Avaliacao. A correção limpa as listas, força um flush (a tabela resposta tem UNIQUE (avaliacao_id, pergunta_id)) e recalcula.",
  "As regras de cálculo ficam isoladas na CalculadoraResultado, e a compatibilidade entre cálculo e tipo de pergunta fica no próprio enum (TipoCalculoEnum.aceita). Valores numéricos usam BigDecimal, que é exato, mapeado em NUMERIC(8,2).",
  "Estrutura em uso é protegida: pergunta com respostas não pode ser excluída nem trocar de tipo, e subgrupo com respostas não pode trocar de cálculo. Correções de texto continuam liberadas. Subgrupo com faixas de classificação não pode ser excluído.",
  "Medidas no aluno e na avaliação: o cadastro guarda as mais recentes e preenche a ficha; a avaliação guarda as do dia e, se for a mais nova do aluno, atualiza o cadastro. IMC e RCE são calculados pela própria Avaliacao, sem coluna no banco.",
  "Relatório de evolução sem tabela própria: o EvolucaoService percorre as avaliações em ordem de data e agrupa os resultados pelo nome do subgrupo (sem diferenciar maiúsculas e espaços) e pelo tipo de cálculo, com LinkedHashMap e computeIfAbsent.",
  "Classificação calculada na consulta: a faixa vale a partir de vlInicio, e o resultado fica com a de maior início que não passa do valor. Como os records de resposta não acessam o banco, o service calcula a classificação e a passa para o método de(...).",
];

function gerarDot({ grupos, heranca, associacoes, composicoes, splines = "ortho" }) {
  const escapar = (t) => t.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const linhas = (campos, estereotipo) => campos.map(([n, t]) =>
    `<TR><TD ALIGN="LEFT">${estereotipo === "enumeration" || n === "..." ? "" : (n.includes("(") ? "+ " : "- ")}${escapar(n)}</TD><TD ALIGN="LEFT">${t ? ": " + escapar(t) : ""}</TD></TR>`).join("");
  const classe = (nome, campos, estereotipo) => {
    const cab = estereotipo ? `<TR><TD COLSPAN="2"><I>&lt;&lt;${estereotipo}&gt;&gt;</I></TD></TR>` : "";
    const titulo = estereotipo === "abstract" ? `<I>${nome}</I>` : nome;
    return `"${nome}" [label=<<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="4">${cab}<TR><TD COLSPAN="2" BGCOLOR="#1F3864"><FONT COLOR="white"><B>${titulo}</B></FONT></TD></TR>${linhas(campos, estereotipo)}</TABLE>>];`;
  };
  let dot = `digraph Classes { rankdir=LR; graph [fontname="Helvetica", nodesep=0.45, ranksep=1.0, splines=${splines}];
    node [shape=plain, fontname="Helvetica", fontsize=11]; edge [fontname="Helvetica", fontsize=10, color="#555555"];\n`;
  grupos.forEach((g, i) => {
    dot += `subgraph cluster_${i} { label="${g.nome}"; style=filled; color="${g.cor}"; fontname="Helvetica-Bold"; fontsize=13;\n`;
    g.classes.forEach(([n, c, e]) => { dot += classe(n, c, e) + "\n"; });
    dot += "}\n";
  });
  heranca.forEach(([filha, mae]) => { dot += `"${filha}" -> "${mae}" [arrowhead=onormal, arrowsize=1.2, color="#1F3864", penwidth=1.5];\n`; });
  associacoes.forEach(([a, b, ca, cb, extra]) => { dot += `"${a}" -> "${b}" [arrowhead=none, taillabel="${ca}", headlabel="${cb}", labeldistance=1.6${extra ? ", " + extra : ""}];\n`; });
  composicoes.forEach(([a, b, ca, cb]) => { dot += `"${a}" -> "${b}" [dir=both, arrowtail=diamond, arrowhead=none, taillabel="${ca}", headlabel="${cb}", labeldistance=1.6, color="#548235", penwidth=1.5];\n`; });
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

async function imagem(viz, modelo, largura) {
  const svg = viz.renderString(gerarDot(modelo), { format: "svg" })
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
  const bullet = (t) => new Paragraph({ text: t, bullet: { level: 0 }, spacing: { after: 60 } });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "Impulso", bold: true, size: 44, color: HEADER_BG })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "Plano de Classes", size: 30 })] }),
        p("Este documento descreve as classes de domínio do Impulso e a organização do backend (Spring Boot 4, Java 17) em pacotes. Ele reflete o código implementado nas Fases 1 (cadastros), 2 (módulo de avaliação) e 3 (evolução, medidas e classificação)."),
        h1("1. Diagramas de Classes de Domínio"),
        p("Setas com triângulo vazado indicam herança. Linhas simples são associações, com a cardinalidade em cada ponta. O losango (diagrama 2) indica composição: a parte só existe dentro do todo e é salva e apagada junto com ele."),
        h2("1.1 Cadastros (Fases 1 e 3)"),
        await imagem(viz, cadastros, 620),
        h2("1.2 Avaliação e classificação (Fases 2 e 3)"),
        await imagem(viz, avaliacao, 620),
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
