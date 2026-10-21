// Uso: node gerar_especificacao_fase2.js [saida.docx]  (padrão: ../Especificacao_Detalhada_Fase2.docx)
// Os exemplos usam nomes genéricos de testes e critérios fictícios: o conteúdo real das fichas
// pode ser licenciado e fica só no banco da instância, nunca no repositório.
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { instance } = require("@viz-js/viz");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  AlignmentType, ShadingType, Table, TableRow, TableCell, WidthType, BorderStyle
} = require("docx");

const HEADER_BG = "1F3864";
const SAIDA = process.argv[2] || path.join(__dirname, "..", "Especificacao_Detalhada_Fase2.docx");

const entidades = [
  ["Grupo", "nmGrupo, nrIdadeMin, nrIdadeMax; subgrupos (1:N)", "Modelo da ficha para uma faixa etária (em anos). Só o ADMIN cadastra. As faixas dos grupos não podem se sobrepor. Só é excluído se não tiver subgrupos nem avaliações."],
  ["Subgrupo", "nmSubgrupo, tpCalculo, nrOrdem, grupo; perguntas (1:N)", "Um teste ou uma habilidade. O tpCalculo define o resultado e só muda se o grupo não tiver avaliações. Só é excluído se não tiver perguntas."],
  ["Pergunta", "dsPergunta, tpResposta, dsUnidade, nrOrdem, subgrupo", "O tipo precisa combinar com o cálculo do subgrupo. Tipo e exclusão só mudam se a pergunta não tiver respostas."],
  ["Avaliacao", "dtAvaliacao, aluno, profissional, grupo; respostas e resumos (1:N)", "A idade do aluno na data escolhe o grupo. O profissional gravado é o do aluno naquele momento. Pode ser editada; o grupo não muda na edição."],
  ["Resposta", "vlResposta (número) ou tpOpcao (SIM, NAO, PARCIAL), pergunta, avaliacao", "Uma por pergunta. A pergunta precisa ser do grupo da avaliação. Perguntas sem resposta são aceitas (teste não realizado)."],
  ["AvaliacaoResumo", "vlResultado ou tpEstagio, subgrupo, avaliacao", "Calculado pelo sistema ao salvar e ao editar; nunca enviado pelo cliente."],
  ["Aluno (alteração)", "+ sexo (MASCULINO, FEMININO; coluna tp_sexo), obrigatório", "Usado pelas tabelas de referência do relatório (Fase 3)."],
];

const enums = [
  ["SexoEnum", "MASCULINO, FEMININO"],
  ["TipoCalculoEnum", "NENHUM, MAIOR_VALOR, MENOR_VALOR, ESTAGIO"],
  ["TipoRespostaEnum", "NUMERO, SIM_NAO_PARCIAL"],
  ["TipoOpcaoEnum", "SIM, NAO, PARCIAL"],
  ["EstagioEnum", "INICIAL, ELEMENTAR, MADURO"],
];

const calculos = [
  ["NENHUM", "Qualquer", "Não gera resultado; os valores ficam só nas respostas.", "Medidas do corpo"],
  ["MAIOR_VALOR", "NUMERO", "O maior número entre as respostas do subgrupo.", "Salto horizontal (2 tentativas)"],
  ["MENOR_VALOR", "NUMERO", "O menor número entre as respostas do subgrupo.", "Teste do quadrado (menor tempo)"],
  ["ESTAGIO", "SIM_NAO_PARCIAL", "Conta SIM, NÃO e PARCIAL e aplica a regra de estágio abaixo.", "Uma habilidade motora"],
];

const estagios = [
  ["2 ou mais NÃO", "INICIAL"],
  ["Nenhum NÃO e no máximo 1 PARCIAL", "MADURO"],
  ["Todos os outros casos (até 1 NÃO e até 2 PARCIAL)", "ELEMENTAR"],
  ["Até 1 NÃO e 3 ou mais PARCIAL (a regra original não cobre)", "ELEMENTAR (decisão provisória)"],
];

const permissoes = [
  ["Cadastrar, editar e excluir grupo, subgrupo e pergunta", "✔", "—", "—"],
  ["Listar grupos e ver a estrutura completa", "✔", "✔", "—"],
  ["Gerar a ficha do aluno e registrar avaliação", "✔ (todos)", "✔ (só os seus alunos)", "—"],
  ["Listar, ver, editar e excluir avaliações", "✔ (todos)", "✔ (só os seus alunos)", "— (consulta na Fase 3)"],
];

const rotas = [
  ["GET", "/api/grupo", "ADMIN, PROFISSIONAL", "Lista os grupos (nome e faixa), pela idade mínima", "200"],
  ["GET", "/api/grupo/{id}", "ADMIN, PROFISSIONAL", "Estrutura completa: subgrupos > perguntas", "200 / 404"],
  ["POST", "/api/grupo", "ADMIN", "Cadastra grupo (faixa etária)", "201 / 400 / 409"],
  ["PUT", "/api/grupo/{id}", "ADMIN", "Edita grupo", "200 / 400 / 404 / 409"],
  ["DELETE", "/api/grupo/{id}", "ADMIN", "Exclui grupo sem subgrupos e sem avaliações", "204 / 404 / 409"],
  ["POST", "/api/grupo/{id}/subgrupo", "ADMIN", "Cadastra subgrupo", "201 / 400 / 404"],
  ["PUT", "/api/subgrupo/{id}", "ADMIN", "Edita subgrupo", "200 / 400 / 404 / 409"],
  ["DELETE", "/api/subgrupo/{id}", "ADMIN", "Exclui subgrupo sem perguntas", "204 / 404 / 409"],
  ["POST", "/api/subgrupo/{id}/pergunta", "ADMIN", "Cadastra pergunta", "201 / 400 / 404"],
  ["PUT", "/api/pergunta/{id}", "ADMIN", "Edita pergunta", "200 / 400 / 404 / 409"],
  ["DELETE", "/api/pergunta/{id}", "ADMIN", "Exclui pergunta sem respostas", "204 / 404 / 409"],
  ["GET", "/api/aluno/{alunoId}/avaliacao/ficha?dtAvaliacao=", "ADMIN, PROFISSIONAL", "Grupo da idade do aluno, com subgrupos e perguntas (data opcional, padrão hoje)", "200 / 400 / 404"],
  ["POST", "/api/aluno/{alunoId}/avaliacao", "ADMIN, PROFISSIONAL", "Registra a avaliação e calcula os resultados", "201 / 400 / 404"],
  ["GET", "/api/aluno/{alunoId}/avaliacao", "ADMIN, PROFISSIONAL", "Lista as avaliações do aluno (mais recente primeiro)", "200 / 404"],
  ["GET", "/api/aluno/{alunoId}/avaliacao/{id}", "ADMIN, PROFISSIONAL", "Avaliação com respostas e resultados", "200 / 404"],
  ["PUT", "/api/aluno/{alunoId}/avaliacao/{id}", "ADMIN, PROFISSIONAL", "Corrige data e respostas e recalcula", "200 / 400 / 404"],
  ["DELETE", "/api/aluno/{alunoId}/avaliacao/{id}", "ADMIN, PROFISSIONAL", "Exclui a avaliação", "204 / 404"],
  ["POST / PUT", "/api/aluno e /api/aluno/{id}", "ADMIN, PROFISSIONAL", "Passam a exigir sexo", "400 sem o campo"],
];

const erros = [
  ["400", "Faixa etária inválida (mínima maior que a máxima); pergunta com tipo que não combina com o cálculo do subgrupo; avaliação sem nenhuma resposta; pergunta que não é do grupo da avaliação; resposta no formato errado para o tipo da pergunta; pergunta repetida; data que tira o aluno da faixa do grupo na edição", "{\"erro\": \"A pergunta 31 não pertence ao grupo desta avaliação!\"}"],
  ["404", "Grupo, subgrupo, pergunta ou avaliação inexistente; aluno de outro profissional; nenhum grupo atende a idade do aluno", "{\"erro\": \"Nenhum grupo atende a idade de 4 anos!\"}"],
  ["409", "Faixa que se sobrepõe a outro grupo; exclusão ou troca de tipo/cálculo de estrutura já usada", "{\"erro\": \"A faixa etária se sobrepõe a outro grupo!\"}"],
];

const exemplos = [
  "GET /api/aluno/42/avaliacao/ficha?dtAvaliacao=2026-10-14",
  "→ 200 { \"grupoId\": 3, \"nmGrupo\": \"Grupo 2\", \"nrIdade\": 6,",
  "        \"subgrupos\": [",
  "          { \"id\": 10, \"nmSubgrupo\": \"Salto horizontal\", \"tpCalculo\": \"MAIOR_VALOR\",",
  "            \"perguntas\": [ { \"id\": 31, \"dsPergunta\": \"Tentativa 1\", \"tpResposta\": \"NUMERO\", \"dsUnidade\": \"cm\" },",
  "                           { \"id\": 32, \"dsPergunta\": \"Tentativa 2\", \"tpResposta\": \"NUMERO\", \"dsUnidade\": \"cm\" } ] },",
  "          { \"id\": 12, \"nmSubgrupo\": \"Habilidade A\", \"tpCalculo\": \"ESTAGIO\",",
  "            \"perguntas\": [ { \"id\": 40, \"dsPergunta\": \"Critério 1\", \"tpResposta\": \"SIM_NAO_PARCIAL\" }, ... ] } ] }",
  "",
  "POST /api/aluno/42/avaliacao",
  "{ \"dtAvaliacao\": \"2026-10-14\",",
  "  \"respostas\": [ { \"perguntaId\": 31, \"vlResposta\": 120.5 },",
  "                 { \"perguntaId\": 32, \"vlResposta\": 131.0 },",
  "                 { \"perguntaId\": 40, \"tpOpcao\": \"SIM\" },",
  "                 { \"perguntaId\": 41, \"tpOpcao\": \"PARCIAL\" }, ... ] }",
  "→ 201 { \"id\": 7, \"dtAvaliacao\": \"2026-10-14\", \"nrIdade\": 6, \"grupoId\": 3, \"nmGrupo\": \"Grupo 2\",",
  "        \"profissionalId\": 5, \"respostas\": [ ... ],",
  "        \"resultados\": [ { \"subgrupoId\": 10, \"nmSubgrupo\": \"Salto horizontal\", \"vlResultado\": 131.0, \"tpEstagio\": null },",
  "                        { \"subgrupoId\": 12, \"nmSubgrupo\": \"Habilidade A\", \"vlResultado\": null, \"tpEstagio\": \"MADURO\" } ] }",
];

const criterios = [
  ["RF05", "Só ADMIN monta a estrutura", "um PROFISSIONAL logado", "faz POST /api/grupo", "recebe 403"],
  ["RF05", "Faixas sem sobreposição", "o Grupo 2 tem faixa de 6 a 7 anos", "o ADMIN cadastra um grupo de 7 a 9", "recebe 409"],
  ["RF07", "Tipo combina com o cálculo", "um subgrupo com cálculo ESTAGIO", "o ADMIN cadastra nele uma pergunta NUMERO", "recebe 400"],
  ["RF06", "Ficha pela idade", "aluno com 6 anos completos na data e Grupo 2 de 6 a 7", "o profissional pede a ficha", "recebe o Grupo 2 com subgrupos e perguntas em ordem"],
  ["RF06", "Idade sem grupo", "aluno com 4 anos e nenhum grupo cobrindo 4", "o profissional pede a ficha", "recebe 404"],
  ["RF08", "Melhor tentativa (maior)", "subgrupo MAIOR_VALOR", "registra 120,5 e 131,0", "o resultado do subgrupo é 131,0"],
  ["RF08", "Melhor tentativa (menor)", "subgrupo MENOR_VALOR", "registra 7,10 e 6,95", "o resultado do subgrupo é 6,95"],
  ["RF08", "Estágio Maduro", "habilidade com 6 critérios", "marca 5 SIM e 1 PARCIAL", "o estágio é MADURO"],
  ["RF08", "Estágio Elementar", "habilidade com 6 critérios", "marca 4 SIM, 1 NÃO e 1 PARCIAL", "o estágio é ELEMENTAR"],
  ["RF08", "Estágio Inicial", "habilidade com 6 critérios", "marca 4 SIM e 2 NÃO", "o estágio é INICIAL"],
  ["RF06", "Pergunta de outro grupo", "uma pergunta do Grupo 3", "é enviada numa avaliação do Grupo 2", "recebe 400"],
  ["RF08", "Edição recalcula", "avaliação com estágio MADURO", "o profissional troca um SIM por NÃO e outro por NÃO", "o estágio passa a INICIAL"],
  ["RC01", "Isolamento", "a avaliação é de um aluno do profissional A", "o profissional B tenta abri-la", "recebe 404"],
  ["RF05", "Estrutura em uso", "uma pergunta com respostas registradas", "o ADMIN tenta excluí-la", "recebe 409"],
];

const tarefas = [
  ["1", "Sexo do aluno: SexoEnum, Aluno.sexo (coluna tp_sexo), AlunoRequest e AlunoResponse", "Concluída"],
  ["2", "Estrutura — entidades e repositórios: Grupo, Subgrupo, Pergunta, TipoCalculoEnum, TipoRespostaEnum (@OneToMany com mappedBy e @OrderBy)", "Pendente"],
  ["3", "Estrutura — cadastro pelo ADMIN: DTOs, services e controllers, com as regras de faixa, compatibilidade e exclusão", "Pendente"],
  ["4", "Avaliação — entidades e repositórios: Avaliacao, Resposta, AvaliacaoResumo, TipoOpcaoEnum, EstagioEnum (cascade e orphanRemoval)", "Pendente"],
  ["5", "Ficha do aluno: idade na data escolhe o grupo", "Pendente"],
  ["6", "Registrar avaliação: validações e cálculo dos resultados (classe CalculadoraResultado)", "Pendente"],
  ["7", "Consultar, editar (recalcula) e excluir avaliação", "Pendente"],
  ["8", "Testes automatizados dos critérios de aceite", "Adiada"],
];

const dotModelo = `digraph Modelo {
  rankdir=LR; graph [fontname="Helvetica", nodesep=0.35, ranksep=0.55];
  node [fontname="Helvetica", fontsize=11, shape=box, style="filled,rounded", fontcolor="white"];
  edge [fontname="Helvetica", fontsize=9, color="#555555"];
  subgraph cluster_estrutura { label="Estrutura da ficha (cadastrada pelo ADMIN)"; style=filled; color="#DDEBF7"; fontname="Helvetica-Bold"; fontsize=12;
    G [label="Grupo\\nnmGrupo, nrIdadeMin, nrIdadeMax", fillcolor="#1F3864"];
    S [label="Subgrupo\\nnmSubgrupo, tpCalculo, nrOrdem", fillcolor="#1F3864"];
    P [label="Pergunta\\ndsPergunta, tpResposta,\\ndsUnidade, nrOrdem", fillcolor="#1F3864"];
    G -> S [label="1:N"]; S -> P [label="1:N"];
  }
  subgraph cluster_avaliacao { label="Avaliação (registrada pelo profissional)"; style=filled; color="#E2EFDA"; fontname="Helvetica-Bold"; fontsize=12;
    A [label="Avaliacao\\ndtAvaliacao", fillcolor="#548235"];
    R [label="Resposta\\nvlResposta | tpOpcao", fillcolor="#548235"];
    AR [label="AvaliacaoResumo\\nvlResultado | tpEstagio", fillcolor="#548235"];
    A -> R [label="1:N"]; A -> AR [label="1:N"];
  }
  AL [label="Aluno\\n(+ sexo)", fillcolor="#833C0C"];
  PR [label="Profissional", fillcolor="#833C0C"];
  A -> AL [label="N:1"]; A -> PR [label="N:1"];
  A -> G [label="grupo usado", style=dashed]; R -> P [label="responde", style=dashed]; AR -> S [label="resultado de", style=dashed];
}`;

const dotFluxo = `digraph Fluxo {
  rankdir=TB; graph [fontname="Helvetica", nodesep=0.5, ranksep=0.4, splines=ortho];
  node [fontname="Helvetica", fontsize=12, shape=box, style="filled,rounded", fontcolor="white", width=4.2, margin="0.3,0.12"];
  edge [fontname="Helvetica", fontsize=10, color="#555555"];
  F1 [label="Profissional escolhe o aluno", fillcolor="#2E75B6"];
  F2 [label="GET .../avaliacao/ficha\\nidade = anos completos na data da avaliação", fillcolor="#1F3864"];
  F3 [label="Algum grupo\\ncobre essa idade?", shape=diamond, fillcolor="#833C0C", width=3.2, height=1.0];
  F4 [label="404 { erro: Nenhum grupo atende a idade }", fillcolor="#833C0C"];
  F5 [label="Devolve o grupo com subgrupos e perguntas", fillcolor="#1F3864"];
  F6 [label="Profissional preenche os números\\ne marca SIM / NÃO / PARCIAL", fillcolor="#2E75B6"];
  F7 [label="POST .../avaliacao\\nvalida as perguntas e as respostas", fillcolor="#1F3864"];
  F8 [label="Grava as respostas", fillcolor="#548235"];
  F9 [label="CalculadoraResultado, por subgrupo:\\nmaior valor, menor valor ou estágio", fillcolor="#548235"];
  F10 [label="Grava os AvaliacaoResumo e devolve 201", fillcolor="#2E75B6"];
  F1 -> F2 -> F3; F3 -> F4 [label="não"]; F3 -> F5 [label="sim"]; F5 -> F6 -> F7 -> F8 -> F9 -> F10;
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
  const svg = viz.renderString(dot, { format: "svg" });
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

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "Impulso", bold: true, size: 44, color: HEADER_BG })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "Especificação Detalhada — Fase 2: Módulo de Avaliação", size: 30 })] }),
        p("A Fase 2 transforma a ficha de avaliação física e motora em dados. O ADMIN monta a estrutura da ficha (grupo por faixa etária > subgrupo > pergunta); o profissional escolhe o aluno, o sistema usa a idade para escolher o grupo, e ao salvar as respostas calcula o resultado de cada subgrupo: a melhor tentativa ou o estágio motor. A ficha preenchida de um aluno é a Avaliacao."),
        p("Conteúdo das fichas: os textos reais podem ser licenciados. Eles são cadastrados pelo ADMIN na instância e ficam só no banco de dados, nunca no código nem no repositório. Os exemplos deste documento usam nomes genéricos e critérios fictícios."),

        h1("1. Modelo"),
        await imagem(viz, dotModelo, 600),
        tabela(["Entidade", "Campos principais", "Regras"], [1900, 3500, 4100], entidades),
        h2("Enums"),
        tabela(["Enum", "Valores"], [2600, 6900], enums, { monoCols: [1] }),

        h1("2. Regras de Cálculo"),
        p("Cada subgrupo tem um tipo de cálculo, escolhido pelo ADMIN. O tipo das perguntas precisa combinar com ele. Um subgrupo sem nenhuma resposta não gera resultado."),
        tabela(["tpCalculo", "Perguntas aceitas", "Resultado", "Exemplo"], [1700, 1900, 3700, 2200], calculos, { monoCols: [0, 1] }),
        h2("Regra de estágio (subgrupos ESTAGIO)"),
        tabela(["Contagem das respostas", "Estágio"], [6500, 3000], estagios),
        p("Os casos são avaliados nesta ordem. A última linha cobre uma combinação que a regra original não define; a decisão é provisória e fica isolada na CalculadoraResultado, para ser trocada facilmente se for confirmado outro estágio."),
        h2("Idade e grupo"),
        p("Idade = anos completos entre a data de nascimento e a data da avaliação (Period.between(...).getYears()). O grupo escolhido é aquele cuja faixa contém essa idade (como as faixas não se sobrepõem, há no máximo um). Na edição, o grupo da avaliação não muda; se a nova data tirar o aluno da faixa, a edição é recusada com 400."),

        h1("3. Perfis e Permissões"),
        tabela(["Ação", "ADMIN", "PROFISSIONAL", "RESPONSÁVEL"], [4300, 1500, 1900, 1800], permissoes),

        h1("4. Contrato da API"),
        p("Todas as rotas exigem o header Authorization: Bearer <token>. As rotas de avaliação reaproveitam o buscarAlunoPermitido do AlunoService: o profissional só acessa os próprios alunos."),
        tabela(["Método", "Rota", "Perfil", "Descrição", "Respostas"], [900, 3300, 1600, 2200, 1500], rotas, { monoCols: [1], tamanho: 18 }),

        h1("5. Exemplos de Requisição"),
        blocoCodigo(exemplos),

        h1("6. Fluxo da Avaliação"),
        await imagem(viz, dotFluxo, 400),

        h1("7. Novos Casos de Erro"),
        p("O formato do corpo é o mesmo da Fase 1 ({\"erro\": \"...\"}, ou com \"campos\" nas validações de DTO)."),
        tabela(["Código", "Quando acontece", "Exemplo de corpo"], [800, 5500, 3200], erros, { monoCols: [2], tamanho: 18 }),

        h1("8. Critérios de Aceite"),
        p("Formato Dado / Quando / Então."),
        tabela(["Req.", "Cenário", "Dado", "Quando", "Então"], [800, 2000, 2300, 2200, 2200], criterios, { tamanho: 18 }),

        h1("9. Tarefas da Fase 2"),
        tabela(["#", "Tarefa", "Status"], [600, 7400, 1500], tarefas),
      ],
    }],
  });

  fs.writeFileSync(SAIDA, await Packer.toBuffer(doc));
  console.log("OK: " + SAIDA);
}

main().catch((e) => { console.error(e); process.exit(1); });
