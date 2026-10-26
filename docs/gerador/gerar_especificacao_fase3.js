// Uso: node gerar_especificacao_fase3.js [saida.docx]  (padrão: ../Especificacao_Detalhada_Fase3.docx)
// As faixas de classificação reais vêm de tabelas que podem ser licenciadas: os exemplos usam
// nomes e valores fictícios, e o conteúdo real fica só no banco da instância.
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { instance } = require("@viz-js/viz");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  AlignmentType, ShadingType, Table, TableRow, TableCell, WidthType, BorderStyle
} = require("docx");

const HEADER_BG = "1F3864";
const SAIDA = process.argv[2] || path.join(__dirname, "..", "Especificacao_Detalhada_Fase3.docx");

const blocos = [
  ["A", "Acesso do responsável", "O responsável entra no sistema e consulta, sem editar, os dados básicos, as avaliações e a evolução dos filhos.", "RF14"],
  ["B", "Medidas, IMC e RCE", "Peso, estatura e cintura no cadastro do aluno e em cada avaliação. A ficha já vem com as medidas do cadastro, e a avaliação calcula o IMC e a RCE.", "RF18"],
  ["C", "Relatório de evolução", "Linha do tempo das avaliações do aluno, com as medidas e uma série por teste, comparando os resultados mesmo quando ele muda de grupo.", "RF09"],
  ["D", "Classificação", "O ADMIN cadastra as faixas das tabelas de referência por idade e sexo, e os resultados, o IMC e a RCE passam a vir classificados.", "RF18"],
];

const entidades = [
  ["Aluno (alteração)", "+ vlPeso (kg), vlEstatura (cm), vlCintura (cm), opcionais", "Guardam as medidas mais recentes e preenchem a ficha da próxima avaliação. Podem ser editadas no cadastro, e a avaliação mais nova também as atualiza (seção 3.3)."],
  ["Avaliacao (alteração)", "+ vlPeso, vlEstatura, vlCintura; métodos calcularIdade(), calcularImc(), calcularRce()", "As medidas são as do dia da avaliação. O IMC e a RCE são calculados a partir delas na hora da consulta e não têm coluna própria."],
  ["Classificacao (nova)", "tpIndicador, subgrupo (opcional), tpSexo, nrIdadeMin, nrIdadeMax, vlInicio, dsClassificacao", "Uma faixa de tabela de referência: para aquele sexo e aquelas idades, a partir de vlInicio o resultado recebe dsClassificacao. Só o ADMIN cadastra. Com tpIndicador SUBGRUPO, aponta para um subgrupo de resultado numérico; IMC e RCE não têm subgrupo."],
  ["Solicitante (alteração)", "+ responsavel", "Indica que quem chamou é um responsável. O AlunoService usa esse campo para limitar a consulta aos filhos dele."],
];

const enums = [
  ["TipoIndicadorEnum (novo)", "SUBGRUPO, IMC, RCE"],
  ["TipoCalculoEnum (alteração)", "+ método resultadoNumerico(): verdadeiro para MAIOR_VALOR e MENOR_VALOR"],
];

const formulas = [
  ["IMC", "peso ÷ (estatura em metros)²", "peso e estatura", "30,5 kg e 135 cm → 30,5 ÷ 1,35² = 16,74"],
  ["RCE", "cintura ÷ estatura (as duas em cm)", "cintura e estatura", "60 cm e 135 cm → 60 ÷ 135 = 0,44"],
];

const validacoesMedidas = [
  ["vlPeso", "kg", "Só kg", "maior que zero", "até 3 dígitos inteiros e 2 decimais"],
  ["vlEstatura", "cm ou m", "abaixo de 3 é metro: 1.35 vira 135", "30 cm, depois da conversão", "até 3 dígitos inteiros e 2 decimais"],
  ["vlCintura", "cm ou m", "abaixo de 3 é metro: 0.60 vira 60", "20 cm, depois da conversão", "até 3 dígitos inteiros e 2 decimais"],
];

const exemploFaixas = [
  ["Salto (MAIOR_VALOR)", "a partir de 0", "Fraco", "95 → Fraco"],
  ["", "a partir de 100", "Razoável", "100 → Razoável (o início entra na faixa)"],
  ["", "a partir de 120", "Bom", "125 → Bom"],
  ["Quadrado (MENOR_VALOR)", "a partir de 0", "Excelente", "4,8 → Excelente"],
  ["", "a partir de 5", "Bom", "5,5 → Bom"],
  ["", "a partir de 6", "Fraco", "6,0 → Fraco"],
];

const permissoes = [
  ["Ver os alunos (lista e dados básicos)", "✔ (todos)", "✔ (os seus)", "✔ (só os filhos)"],
  ["Ver as avaliações e o relatório de evolução", "✔ (todos)", "✔ (os seus)", "✔ (só os filhos)"],
  ["Gerar a ficha; registrar, corrigir e excluir avaliação", "✔", "✔", "—"],
  ["Cadastrar e editar o aluno e as medidas dele", "✔", "✔", "—"],
  ["Endereços e responsáveis do aluno", "✔", "✔", "—"],
  ["Cadastrar, editar e excluir faixas de classificação", "✔", "—", "—"],
];

const rotas = [
  ["GET", "/api/aluno", "ADMIN, PROFISSIONAL, RESPONSAVEL", "Todos (ADMIN), os seus (PROFISSIONAL) ou os filhos (RESPONSAVEL)", "200"],
  ["GET", "/api/aluno/{id}", "ADMIN, PROFISSIONAL, RESPONSAVEL", "Dados do aluno, agora com as medidas", "200 / 404"],
  ["POST / PUT", "/api/aluno e /api/aluno/{id}", "ADMIN, PROFISSIONAL", "Aceitam vlPeso, vlEstatura e vlCintura (opcionais)", "201 / 200 / 400"],
  ["GET", "/api/aluno/{alunoId}/avaliacao/ficha", "ADMIN, PROFISSIONAL", "Passa a trazer as medidas do cadastro, para a tela vir preenchida", "200 / 400 / 404"],
  ["POST / PUT", "/api/aluno/{alunoId}/avaliacao[/{id}]", "ADMIN, PROFISSIONAL", "Aceitam as medidas do dia; a resposta traz \"medidas\" com IMC e RCE", "201 / 200 / 400 / 404"],
  ["GET", "/api/aluno/{alunoId}/avaliacao", "ADMIN, PROFISSIONAL, RESPONSAVEL", "Lista resumida (sem mudança no formato)", "200 / 404"],
  ["GET", "/api/aluno/{alunoId}/avaliacao/{id}", "ADMIN, PROFISSIONAL, RESPONSAVEL", "Detalhe com medidas, IMC, RCE e classificações", "200 / 404"],
  ["GET", "/api/aluno/{alunoId}/evolucao", "ADMIN, PROFISSIONAL, RESPONSAVEL", "Relatório de evolução", "200 / 404"],
  ["GET", "/api/classificacao?tpIndicador=&subgrupoId=", "ADMIN", "Faixas de um indicador (subgrupoId só para SUBGRUPO), por sexo, idade e início", "200 / 400 / 404"],
  ["POST", "/api/classificacao", "ADMIN", "Cadastra uma faixa", "201 / 400 / 404 / 409"],
  ["PUT", "/api/classificacao/{id}", "ADMIN", "Edita uma faixa", "200 / 400 / 404 / 409"],
  ["DELETE", "/api/classificacao/{id}", "ADMIN", "Exclui uma faixa", "204 / 404"],
  ["DELETE", "/api/subgrupo/{id}", "ADMIN", "Passa a recusar subgrupo com faixas", "409"],
];

const exemplos = [
  "POST /api/aluno/42/avaliacao",
  "{ \"dtAvaliacao\": \"2026-10-25\", \"vlPeso\": 30.5, \"vlEstatura\": 135, \"vlCintura\": 60,",
  "  \"respostas\": [ { \"perguntaId\": 31, \"vlResposta\": 110 }, { \"perguntaId\": 32, \"vlResposta\": 125 }, ... ] }",
  "→ 201 { \"id\": 7, ..., \"medidas\": { \"vlPeso\": 30.5, \"vlEstatura\": 135, \"vlCintura\": 60,",
  "                                \"vlImc\": 16.74, \"dsClassificacaoImc\": \"Saudável\",",
  "                                \"vlRce\": 0.44, \"dsClassificacaoRce\": \"Adequada\" },",
  "        \"resultados\": [ { \"nmSubgrupo\": \"Salto\", \"vlResultado\": 125, \"dsClassificacao\": \"Bom\" }, ... ] }",
  "",
  "POST /api/classificacao",
  "{ \"tpIndicador\": \"SUBGRUPO\", \"subgrupoId\": 10, \"tpSexo\": \"MASCULINO\",",
  "  \"nrIdadeMin\": 6, \"nrIdadeMax\": 7, \"vlInicio\": 120, \"dsClassificacao\": \"Bom\" }",
  "→ 201 { \"id\": 3, \"tpIndicador\": \"SUBGRUPO\", \"subgrupoId\": 10, \"nmSubgrupo\": \"Salto\", ... }",
  "",
  "POST /api/classificacao   (IMC e RCE: sem subgrupo)",
  "{ \"tpIndicador\": \"IMC\", \"subgrupoId\": null, \"tpSexo\": \"FEMININO\",",
  "  \"nrIdadeMin\": 6, \"nrIdadeMax\": 6, \"vlInicio\": 14.5, \"dsClassificacao\": \"Saudável\" }",
  "",
  "GET /api/aluno/42/evolucao",
  "→ 200 { \"alunoId\": 42, \"nmAluno\": \"João\",",
  "        \"avaliacoes\": [",
  "          { \"avaliacaoId\": 5, \"dtAvaliacao\": \"2024-10-25\", \"nrIdade\": 6, \"nmGrupo\": \"Grupo 2\", \"medidas\": { ... } },",
  "          { \"avaliacaoId\": 9, \"dtAvaliacao\": \"2026-10-25\", \"nrIdade\": 8, \"nmGrupo\": \"Grupo 3\", \"medidas\": { ... } } ],",
  "        \"indicadores\": [",
  "          { \"nmSubgrupo\": \"Salto horizontal\", \"tpCalculo\": \"MAIOR_VALOR\", \"pontos\": [",
  "              { \"avaliacaoId\": 5, \"dtAvaliacao\": \"2024-10-25\", \"nrIdade\": 6, \"vlResultado\": 104, \"tpEstagio\": null, \"dsClassificacao\": \"Razoável\" },",
  "              { \"avaliacaoId\": 9, \"dtAvaliacao\": \"2026-10-25\", \"nrIdade\": 8, \"vlResultado\": 130, \"tpEstagio\": null, \"dsClassificacao\": \"Bom\" } ] },",
  "          { \"nmSubgrupo\": \"Habilidade A\", \"tpCalculo\": \"ESTAGIO\", \"pontos\": [",
  "              { ..., \"vlResultado\": null, \"tpEstagio\": \"INICIAL\", \"dsClassificacao\": null } ] } ] }",
];

const erros = [
  ["400", "Medida inválida (peso zero ou negativo; estatura ou cintura que não é medida de criança nem em cm nem em m, ex.: 15; mais de 3 dígitos inteiros ou 2 decimais); faixa com idade mínima maior que a máxima, valor inicial negativo ou campo obrigatório vazio; SUBGRUPO sem subgrupoId; IMC ou RCE com subgrupoId; faixa num subgrupo que não é MAIOR_VALOR nem MENOR_VALOR; listar faixas sem tpIndicador", "{\"erro\": \"Dados Inválidos\", \"campos\": {\"vlEstatura\": \"Estatura inválida: informe em centímetros (135) ou em metros (1.35)!\"}}"],
  ["403", "Responsável em rota de escrita, na ficha, nos endereços ou nos responsáveis do aluno; profissional no cadastro de faixas", "{\"erro\": \"Acesso Negado\"}"],
  ["404", "Responsável pedindo um aluno que não é filho dele (inclusive avaliação e evolução); faixa ou subgrupo inexistente", "{\"erro\": \"Aluno não encontrado!\"}"],
  ["409", "Faixa repetida: mesmo indicador, mesmo sexo, idades que se cruzam e mesmo valor inicial; excluir subgrupo que tem faixas", "{\"erro\": \"Já existe uma faixa começando em 100 para esse sexo e essas idades!\"}"],
];

const criterios = [
  ["RF14", "Só os filhos", "a mãe está vinculada a João e Pedro, alunos de profissionais diferentes", "ela lista os alunos", "recebe João e Pedro, e não os outros alunos"],
  ["RF14", "Isolamento", "Maria não é filha da mãe", "a mãe pede o aluno, as avaliações ou a evolução da Maria", "recebe 404"],
  ["RF14", "Somente leitura", "a mãe está logada", "tenta gerar a ficha, registrar, corrigir ou excluir uma avaliação do filho", "recebe 403"],
  ["RF14", "Sem endereços", "a mãe está logada", "pede os endereços do filho", "recebe 403"],
  ["RF18", "IMC e RCE", "uma avaliação com 30,5 kg, 135 cm de estatura e 60 cm de cintura", "é registrada", "o IMC é 16,74 e a RCE é 0,44"],
  ["RF18", "Ficha preenchida", "o cadastro do aluno tem as medidas", "o profissional pede a ficha", "recebe as medidas do cadastro junto com o grupo"],
  ["RF18", "Mais recente atualiza o cadastro", "o aluno não tem avaliação depois de hoje", "uma avaliação de hoje é registrada com 30,5 kg", "o cadastro do aluno passa a ter 30,5 kg"],
  ["RF18", "Antiga não altera o cadastro", "o aluno já tem uma avaliação de hoje", "uma avaliação de 20 dias atrás é registrada ou corrigida com outro peso", "o cadastro continua com o peso de hoje"],
  ["RF18", "Medida em metros", "a estatura é digitada como 1,35 e a cintura como 0,60", "o cadastro ou a avaliação é enviado", "ficam gravadas 135 cm e 60 cm, e o IMC e a RCE saem iguais aos de quem digitou em centímetros"],
  ["RF18", "Medida impossível", "a estatura é digitada como 15", "o cadastro ou a avaliação é enviado", "recebe 400 com a mensagem mostrando as duas formas aceitas"],
  ["RF18", "Sem estatura, sem índices", "uma avaliação só com o peso", "é registrada", "IMC e RCE ficam vazios, e só o peso vai para o cadastro"],
  ["RF09", "Linha do tempo", "três avaliações registradas fora de ordem", "o profissional pede a evolução", "as avaliações vêm da mais antiga para a mais recente, cada uma com a idade e as medidas"],
  ["RF09", "Troca de grupo", "\"Salto horizontal\" no Grupo 2 e \" salto HORIZONTAL \" no Grupo 3", "a evolução é montada", "os dois viram um único indicador, com os pontos das duas faixas etárias"],
  ["RF09", "Mesmo nome, outro cálculo", "\"Corrida\" como ESTAGIO no Grupo 2 e como MENOR_VALOR no Grupo 3", "a evolução é montada", "aparecem dois indicadores separados"],
  ["RF09", "Sem resultado, sem série", "um subgrupo com cálculo NENHUM", "a evolução é montada", "ele não aparece nos indicadores"],
  ["RF18", "A partir de", "faixas do salto a partir de 0, 100 e 120", "o salto vale 125, e em outra avaliação 100", "a classificação é a da faixa de 120 e, no outro caso, a de 100"],
  ["RF18", "Menor é melhor", "faixas do quadrado a partir de 0 (Excelente), 5 (Bom) e 6 (Fraco)", "o tempo é 5,5", "a classificação é Bom"],
  ["RF18", "Por sexo", "só existem faixas de IMC masculinas", "uma aluna é avaliada", "o IMC dela vem sem classificação"],
  ["RF18", "Faixa repetida", "existe a faixa M, 6 a 7 anos, a partir de 100", "o ADMIN cadastra M, 7 a 9 anos, a partir de 100", "recebe 409"],
  ["RF18", "Estágio não usa faixa", "um subgrupo ESTAGIO", "o ADMIN tenta cadastrar uma faixa nele", "recebe 400"],
  ["RF18", "Correção vale para trás", "uma avaliação já registrada", "o ADMIN renomeia a faixa que a classifica", "a avaliação antiga passa a mostrar o novo nome"],
  ["RF18", "Trava do subgrupo", "um subgrupo com faixas", "o ADMIN tenta excluí-lo", "recebe 409"],
];

const tarefas = [
  ["1", "Acesso do responsável: Solicitante e UsuarioLogado, consultas por responsável no AlunoRepository, AlunoService (listar e buscarAlunoPermitido) e liberação das rotas GET", "Pendente"],
  ["2", "Medidas no cadastro do aluno: Aluno, ConversorMedida (aceita metros), AlunoRequest (validações), AlunoResponse e AlunoService", "Pendente"],
  ["3", "Medidas na avaliação: Avaliacao (campos, calcularImc e calcularRce), FichaResponse, AvaliacaoRequest, MedidasResponse, AvaliacaoResponse e AvaliacaoService (gravar as medidas e atualizar o cadastro)", "Pendente"],
  ["4", "Relatório de evolução: Avaliacao.calcularIdade, DTOs da evolução, EvolucaoService e EvolucaoController", "Pendente"],
  ["5", "Cadastro das faixas: TipoIndicadorEnum, Classificacao, ClassificacaoRepository, DTOs, ClassificacaoService, ClassificacaoController e trava no SubgrupoService", "Pendente"],
  ["6", "Classificação nos resultados: ClassificacaoService.classificar, DTOs com dsClassificacao, montarResposta no AvaliacaoService e na evolução", "Pendente"],
  ["7", "Testes automatizados dos critérios de aceite", "Adiada"],
];

const dotModelo = `digraph Modelo {
  rankdir=TB; graph [fontname="Helvetica", nodesep=0.6, ranksep=0.7];
  node [fontname="Helvetica", fontsize=11, shape=box, style="filled,rounded", fontcolor="white"];
  edge [fontname="Helvetica", fontsize=9, color="#555555"];
  U [label="Usuario\\n(tipo RESPONSAVEL)", fillcolor="#833C0C"];
  R [label="Responsavel", fillcolor="#833C0C"];
  AL [label="Aluno\\n+ vlPeso, vlEstatura, vlCintura", fillcolor="#833C0C"];
  A [label="Avaliacao\\n+ vlPeso, vlEstatura, vlCintura\\ncalcularImc(), calcularRce()", fillcolor="#548235"];
  AR [label="AvaliacaoResumo\\nvlResultado | tpEstagio", fillcolor="#548235"];
  S [label="Subgrupo\\ntpCalculo", fillcolor="#1F3864"];
  C [label="Classificacao (nova)\\ntpIndicador, tpSexo,\\nnrIdadeMin, nrIdadeMax,\\nvlInicio, dsClassificacao", fillcolor="#7030A0"];
  { rank=same; U; R; AL; }
  { rank=same; A; AR; S; }
  U -> R [label="1:1 (acesso)"]; R -> AL [label="N:N (filhos)"];
  AL -> A [label="1:N"]; A -> AR [label="1:N"]; AR -> S [label="N:1"];
  S -> C [label="1:N\\n(tpIndicador SUBGRUPO)"];
  C -> AR [label="classifica o\\nvlResultado", style=dashed];
  C -> A [label="classifica IMC e RCE\\n(sem subgrupo)", style=dashed];
}`;

const dotMedidas = `digraph Medidas {
  rankdir=TB; graph [fontname="Helvetica", nodesep=0.5, ranksep=0.4, splines=ortho];
  node [fontname="Helvetica", fontsize=12, shape=box, style="filled,rounded", fontcolor="white", width=4.6, margin="0.3,0.12"];
  edge [fontname="Helvetica", fontsize=10, color="#555555"];
  M1 [label="Cadastro do aluno guarda as medidas mais recentes\\n(editáveis ali a qualquer momento)", fillcolor="#2E75B6"];
  M2 [label="GET .../avaliacao/ficha\\ndevolve vlPeso, vlEstatura e vlCintura do cadastro", fillcolor="#1F3864"];
  M3 [label="Profissional confere ou mede de novo\\n(campo vazio = medir agora)", fillcolor="#2E75B6"];
  M4 [label="POST ou PUT .../avaliacao\\ngrava as medidas do dia na avaliação", fillcolor="#1F3864"];
  M5 [label="Existe avaliação\\ncom data posterior?", shape=diamond, fillcolor="#833C0C", width=3.2, height=1.0];
  M6 [label="O cadastro não muda", fillcolor="#833C0C"];
  M7 [label="Atualiza no cadastro as medidas preenchidas", fillcolor="#548235"];
  M8 [label="Resposta com IMC e RCE calculados\\n(e classificados, se houver faixa)", fillcolor="#2E75B6"];
  M1 -> M2 -> M3 -> M4 -> M5; M5 -> M6 [label="sim"]; M5 -> M7 [label="não"]; M6 -> M8; M7 -> M8;
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
      children: linhas.map((l) => new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: l || " ", font: "Consolas", size: 15 })] })),
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

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "Impulso", bold: true, size: 44, color: HEADER_BG })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "Especificação Detalhada — Fase 3: Evolução, Medidas e Classificação", size: 30 })] }),
        p("A Fase 3 fecha o backend. O responsável passa a consultar os filhos, as medidas do corpo entram no cadastro e na avaliação (com IMC e RCE), o sistema monta o relatório de evolução e os resultados passam a ser classificados pelas tabelas de referência por idade e sexo. O desenho foi validado numa cópia do backend com testes de ponta a ponta antes de virar roteiro."),
        p("Conteúdo licenciado: as faixas de classificação reais vêm de tabelas que podem ser licenciadas. Elas são cadastradas pelo ADMIN e ficam só no banco da instância, nunca no código nem no repositório. Os nomes e valores deste documento são fictícios."),

        h1("1. Blocos da Fase"),
        tabela(["Bloco", "Entrega", "O que muda para o usuário", "Requisito"], [700, 2100, 5700, 1000], blocos),

        h1("2. Modelo"),
        await imagem(viz, dotModelo, 600),
        tabela(["Entidade", "Campos principais", "Regras"], [1900, 3300, 4300], entidades),
        h2("Enums"),
        tabela(["Enum", "Valores"], [3000, 6500], enums, { monoCols: [1] }),

        h1("3. Regras"),
        h2("3.1 Acesso do responsável"),
        p("O responsável com acesso (Usuario do tipo RESPONSAVEL) vê só os alunos ligados a ele pela tabela aluno_responsavel, mesmo que sejam de profissionais diferentes. As rotas de consulta do aluno e das avaliações e o relatório de evolução são liberados para o perfil com um @PreAuthorize no próprio método, que tem prioridade sobre o da classe. Todas as outras rotas continuam fechadas (403): ficha, registro, correção e exclusão de avaliação, edição do aluno, endereços e responsáveis."),
        p("O isolamento fica no AlunoService.buscarAlunoPermitido, que todas as rotas de aluno e de avaliação já usam: para um responsável, ele só encontra o aluno se houver o vínculo; sem vínculo, a resposta é 404, como já acontece entre profissionais."),
        h2("3.2 Medidas, IMC e RCE"),
        tabela(["Campo", "Unidade aceita", "Conversão", "Mínimo", "Formato"], [1400, 1200, 2700, 2000, 2200], validacoesMedidas, { monoCols: [0] }),
        p("As três medidas são opcionais. A estatura e a cintura podem ser digitadas em centímetros ou em metros, e o sistema reconhece a unidade sozinho: uma criança mede entre 0,5 e 2 em metros e entre 50 e 200 em centímetros, então as duas faixas nunca se cruzam. Um valor abaixo de 3 só pode estar em metros e é multiplicado por 100 (classe ConversorMedida, chamada no construtor dos records AlunoRequest e AvaliacaoRequest, antes da validação). O banco guarda sempre em centímetros, e a resposta mostra o valor já convertido."),
        p("Depois da conversão, estatura abaixo de 30 ou cintura abaixo de 20 não é medida de uma criança em nenhuma das duas unidades (ex.: 15) e dá 400, com uma mensagem que mostra as duas formas aceitas."),
        tabela(["Índice", "Fórmula", "Precisa de", "Exemplo"], [900, 3200, 1900, 3500], formulas),
        p("Os índices são arredondados para 2 casas (HALF_UP) e calculados só com as medidas da própria avaliação: sem estatura, não há IMC nem RCE. Eles não são gravados; a Avaliacao os calcula sempre que é consultada."),
        h2("3.3 Medidas entre o cadastro e a avaliação"),
        await imagem(viz, dotMedidas, 420),
        p("A ficha devolve as medidas do cadastro para a tela já vir preenchida; se o cadastro estiver vazio, os campos vêm vazios e são preenchidos na avaliação. O que for enviado no registro ou na correção é o que fica gravado na avaliação. Depois de gravar, se não existir avaliação do aluno com data posterior, as medidas preenchidas atualizam o cadastro (as vazias não apagam nada). Uma avaliação antiga, lançada ou corrigida depois, não mexe no cadastro."),
        p("O cadastro também pode ser editado direto (PUT /api/aluno/{id}). Como o PUT substitui o cadastro inteiro, enviar uma medida vazia apaga a medida. Excluir uma avaliação não desfaz o que ela gravou no cadastro."),
        h2("3.4 Relatório de evolução"),
        p("O relatório traz duas partes. Em avaliacoes, uma linha por avaliação, da mais antiga para a mais recente, com a idade na data, o grupo e as medidas (com IMC e RCE). Em indicadores, uma série por teste, com um ponto por avaliação em que o teste teve resultado."),
        p("Os testes são reconhecidos pelo nome do subgrupo e pelo tipo de cálculo. O nome é comparado sem diferenciar maiúsculas e minúsculas e sem os espaços das pontas. Assim, o mesmo teste aparece numa única série quando o aluno muda de grupo. Um subgrupo com o mesmo nome e outro cálculo vira outra série (ex.: uma habilidade avaliada por estágio e um teste de tempo). Subgrupos com cálculo NENHUM não geram resultado e ficam fora."),
        h2("3.5 Classificação"),
        p("Cada faixa diz: para este sexo e estas idades, a partir deste valor, o resultado recebe esta classificação. Na consulta, vale a faixa de maior valor inicial que não passa do resultado. A regra funciona igual para testes em que maior é melhor e para os de tempo, em que menor é melhor, e não deixa buracos entre as faixas."),
        tabela(["Indicador (exemplo fictício, M, 6 a 7 anos)", "Faixa", "Classificação", "Resultado → classificação"], [2900, 1700, 1700, 3200], exemploFaixas),
        p("O indicador SUBGRUPO usa o resultado do subgrupo e só é aceito para cálculos MAIOR_VALOR e MENOR_VALOR; o estágio motor já é uma classificação. IMC e RCE usam faixas sem subgrupo. A idade e o sexo são os do aluno na data da avaliação. Se nenhuma faixa servir, a classificação fica vazia."),
        p("A classificação é calculada na consulta, e não gravada. Assim, as avaliações registradas antes de as faixas existirem passam a ser classificadas assim que o ADMIN cadastra a tabela, e corrigir uma faixa vale também para as avaliações antigas. O cadastro recusa faixas repetidas (mesmo indicador e sexo, idades que se cruzam e mesmo valor inicial), e um subgrupo com faixas não pode ser excluído."),

        h1("4. Perfis e Permissões"),
        tabela(["Ação", "ADMIN", "PROFISSIONAL", "RESPONSÁVEL"], [4300, 1500, 1800, 1900], permissoes),

        h1("5. Contrato da API"),
        p("Todas as rotas exigem o header Authorization: Bearer <token>. As novidades da Fase 3 e as rotas que mudaram:"),
        tabela(["Método", "Rota", "Perfil", "Descrição", "Respostas"], [900, 3100, 1800, 2200, 1500], rotas, { monoCols: [1], tamanho: 18 }),

        h1("6. Exemplos de Requisição"),
        blocoCodigo(exemplos),

        h1("7. Novos Casos de Erro"),
        p("O formato do corpo é o mesmo das fases anteriores ({\"erro\": \"...\"}, ou com \"campos\" nas validações de DTO)."),
        tabela(["Código", "Quando acontece", "Exemplo de corpo"], [800, 5500, 3200], erros, { monoCols: [2], tamanho: 18 }),

        h1("8. Critérios de Aceite"),
        p("Formato Dado / Quando / Então. Todos foram verificados em testes de ponta a ponta na cópia do backend, junto com os testes das Fases 1 e 2."),
        tabela(["Req.", "Cenário", "Dado", "Quando", "Então"], [800, 2000, 2300, 2200, 2200], criterios, { tamanho: 18 }),

        h1("9. Tarefas da Fase 3"),
        tabela(["#", "Tarefa", "Status"], [600, 7400, 1500], tarefas),
      ],
    }],
  });

  fs.writeFileSync(SAIDA, await Packer.toBuffer(doc));
  console.log("OK: " + SAIDA);
}

main().catch((e) => { console.error(e); process.exit(1); });
