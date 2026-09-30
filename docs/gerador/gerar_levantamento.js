const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, PageOrientation
} = require("docx");

const COLORS = {
  headerBg: "1F3864",
  headerText: "FFFFFF",
  altRow: "F2F2F2",
  futureBg: "FCE4D6",
};

function cell(text, opts = {}) {
  const { width, bold = false, bg, color, align = AlignmentType.LEFT } = opts;
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: bg ? { type: ShadingType.CLEAR, fill: bg } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({ text: String(text), bold, color: color || undefined }),
        ],
      }),
    ],
  });
}

function headerRow(headers, widths) {
  return new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      cell(h, { width: widths[i], bold: true, bg: COLORS.headerBg, color: COLORS.headerText })
    ),
  });
}

function reqTable(rows, widths, headers) {
  const trs = [headerRow(headers, widths)];
  rows.forEach((r, idx) => {
    const isFuture = r.status && r.status.toLowerCase().includes("fase 2");
    const bg = isFuture ? COLORS.futureBg : (idx % 2 === 1 ? COLORS.altRow : undefined);
    trs.push(
      new TableRow({
        children: [
          cell(r.id, { width: widths[0], bold: true, bg }),
          cell(r.desc, { width: widths[1], bg }),
          ...(r.status !== undefined ? [cell(r.status, { width: widths[2], bg })] : []),
        ],
      })
    );
  });
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: trs,
  });
}

function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 150 } });
}
function h2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });
}
function p(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 120 } });
}
function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 60 } });
}

const RF = [
  { id: "RF01", desc: "O sistema deve permitir manter (cadastrar, consultar, editar e inativar) alunos." },
  { id: "RF02", desc: "O sistema deve permitir manter (cadastrar, consultar, editar e inativar) profissionais." },
  { id: "RF03", desc: "O sistema deve permitir manter usuários dos tipos Profissional e Responsável, vinculados a uma entidade Usuário comum." },
  { id: "RF04", desc: "O sistema deve permitir registrar a avaliação física/motora do aluno, organizada em três dimensões: Dimensão Corporal, Aptidão Física e Aptidão Motora." },
  { id: "RF05", desc: "O sistema deve permitir cadastrar Questionários de avaliação, cada um associado a uma faixa etária (idade mínima e máxima) e a um conjunto de Perguntas." },
  { id: "RF06", desc: "Ao registrar uma avaliação, o sistema deve armazenar qual Questionário foi utilizado (não apenas a idade do aluno no momento), preservando o histórico mesmo que as faixas etárias sejam alteradas depois." },
  { id: "RF07", desc: "O sistema deve suportar perguntas dos tipos: múltipla escolha, verdadeiro/falso, escala, texto livre e medida numérica (com unidade)." },
  { id: "RF08", desc: "Ao salvar as respostas de um checklist de habilidade motora, o sistema deve calcular automaticamente e armazenar um score resumido por categoria/habilidade (AvaliacaoResumo)." },
  { id: "RF09", desc: "O sistema deve exibir um relatório de evolução do aluno, comparando os resultados de diferentes avaliações ao longo do tempo." },
  { id: "RF10", desc: "O sistema deve permitir autenticação do usuário por e-mail e senha, emitindo um token JWT." },
  { id: "RF11", desc: "O sistema deve permitir que um Profissional cadastre outros usuários (Profissional ou Responsável)." },
  { id: "RF12", desc: "O sistema deve permitir que um usuário do tipo Admin altere as informações de qualquer usuário do sistema." },
  { id: "RF13", desc: "O sistema deve permitir vincular um aluno a um ou mais responsáveis, e um responsável a um ou mais alunos (relação N:N)." },
  { id: "RF14", desc: "O sistema deve permitir que o Responsável visualize as avaliações e o relatório de evolução apenas dos alunos vinculados a ele, sem permissão de edição." },
  { id: "RF15", desc: "O sistema deve manter cadastros de referência geográfica (País, Estado, Cidade) para uso nos endereços de alunos." },
];

const RNF = [
  { id: "RNF01", desc: "O sistema deve ser implementado como uma aplicação web, com backend e frontend desacoplados (revisão do requisito original de aplicativo mobile Android/iOS)." },
  { id: "RNF02", desc: "O backend deve ser desenvolvido em Java 17+ com Spring Boot 3.x (Spring Web, Spring Data JPA, Spring Security), utilizando Maven como ferramenta de build." },
  { id: "RNF03", desc: "O frontend deve ser desenvolvido em React, consumindo o backend via API REST." },
  { id: "RNF04", desc: "O banco de dados utilizado deve ser o PostgreSQL." },
  { id: "RNF05", desc: "A autenticação deve ser feita via JWT, emitido a partir da entidade Usuario." },
  { id: "RNF06", desc: "O sistema deve funcionar como uma base reaproveitável: cada empresa cliente executa sua própria instância, sem compartilhamento de dados entre instâncias (não multi-tenant)." },
  { id: "RNF07", desc: "O sistema requer conexão com a internet para funcionar." },
];

const RC = [
  { id: "RC01", desc: "Somente usuários do tipo Profissional podem editar ou adicionar informações ao cadastro de alunos.", status: "Confirmado" },
  { id: "RC02", desc: "Os cadastros de referência geográfica (País, Estado, Cidade) devem ser somente leitura para os demais perfis de usuário.", status: "Confirmado" },
  { id: "RC03", desc: "O campo Aluno.tpServico deve indicar a frequência semanal de aulas contratada pelo aluno (ex.: 1x/semana, 2x/semana, diária), como um enum simples — sem depender de uma estrutura completa de Aula/Contrato.", status: "Confirmado" },
  { id: "RC04", desc: "O sistema deve avisar os responsáveis sobre o horário de aula com 1 hora de antecedência.", status: "Fase 2 (fora do escopo do MVP)" },
  { id: "RC05", desc: "O sistema deve permitir o controle de exercícios realizados em aula.", status: "Fase 2 (fora do escopo do MVP)" },
  { id: "RC06", desc: "O sistema deve permitir o controle do contrato do aluno.", status: "Fase 2 (fora do escopo do MVP)" },
  { id: "RC07", desc: "O sistema deve possuir uma versão mobile (Android/iOS).", status: "Fase 2 (fora do escopo do MVP)" },
];

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Impulso", bold: true, size: 44, color: COLORS.headerBg })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "Levantamento de Requisitos", size: 30 })],
        }),
        p("Este documento consolida os requisitos funcionais, não funcionais e complementares do Impulso, sistema de controle de avaliações físico/motoras para um programa infantil de avaliação física/motora. Os requisitos foram levantados a partir de uma versão inicial e reconciliados com decisões de arquitetura tomadas posteriormente (troca de plataforma mobile para web, modelagem de avaliações baseada em Questionário/Pergunta/AvaliacaoResumo, e definição do escopo do MVP)."),

        h1("1. Requisitos Funcionais"),
        reqTable(RF, [1200, 8300], ["ID", "Descrição"]),

        h1("2. Requisitos Não Funcionais"),
        reqTable(RNF, [1200, 8300], ["ID", "Descrição"]),

        h1("3. Requisitos Complementares"),
        p("Requisitos de regra de negócio, restrições e funcionalidades adicionais. Itens marcados como \"Fase 2\" estão fora do escopo do MVP e ficam para uma etapa futura do projeto."),
        reqTable(RC, [1200, 6300, 2000], ["ID", "Descrição", "Status"]),

        h1("4. Decisões de Escopo Registradas"),
        bullet("Plataforma: sistema web (React + Spring Boot REST), não aplicativo mobile — RC07 fica para fase futura."),
        bullet("Aula, Horário (com notificação) e Contrato do aluno (RC04, RC05, RC06) ficam fora do MVP; o foco inicial é o módulo de avaliações, que é a parte de maior complexidade de domínio."),
        bullet("O campo tpServico do Aluno é mantido no MVP como um enum simples de frequência semanal (RC03), sem exigir as entidades completas de Aula/Contrato."),
        bullet("O score por categoria (AvaliacaoResumo) é calculado no momento do salvamento das respostas e armazenado, não recalculado sob demanda — garante estabilidade do relatório de evolução caso os critérios de uma habilidade sejam alterados no futuro."),
        bullet("As faixas etárias reais de cada Questionario ainda não foram definidas; o modelo já suporta idade_min/idade_max, a preencher quando definido."),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  require("fs").writeFileSync(process.argv[2], buffer);
  console.log("OK: " + process.argv[2]);
});
