// Uso: node gerar_levantamento.js [saida.docx]  (padrão: ../Levantamento_de_Requisitos.docx)
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, AlignmentType
} = require("docx");

const SAIDA = process.argv[2] || path.join(__dirname, "..", "Levantamento_de_Requisitos.docx");

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

// Linhas ainda não entregues (fase 3, fase futura) ficam destacadas.
function pendente(status) {
  const s = (status || "").toLowerCase();
  return s.includes("fase 3") || s.includes("futura") || s.includes("pendente");
}

function reqTable(rows, widths, headers) {
  const trs = [headerRow(headers, widths)];
  rows.forEach((r, idx) => {
    const bg = pendente(r.status) ? COLORS.futureBg : (idx % 2 === 1 ? COLORS.altRow : undefined);
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
function p(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 120 } });
}
function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 60 } });
}

const RF = [
  { id: "RF01", desc: "O sistema deve permitir manter (cadastrar, consultar, editar e inativar) alunos.", status: "Fase 1, exceto inativar (pendente)" },
  { id: "RF02", desc: "O sistema deve permitir manter (cadastrar, consultar, editar e inativar) profissionais.", status: "Fase 1 (inativar = bloquear o acesso)" },
  { id: "RF03", desc: "O sistema deve permitir manter usuários dos tipos Profissional e Responsável, vinculados a uma entidade Usuário comum.", status: "Fase 1" },
  { id: "RF04", desc: "O sistema deve permitir registrar a avaliação física/motora do aluno, organizada conforme a ficha cadastrada (ex.: Dimensão Corporal, Aptidão Física e Aptidão Motora).", status: "Fase 2" },
  { id: "RF05", desc: "O sistema deve permitir que o ADMIN cadastre a estrutura da ficha de avaliação: Grupos por faixa etária (idade mínima e máxima, sem sobreposição), Subgrupos (testes ou habilidades, cada um com um tipo de cálculo) e Perguntas.", status: "Fase 2" },
  { id: "RF06", desc: "Ao registrar uma avaliação, o sistema deve escolher o Grupo pela idade do aluno na data da avaliação e armazenar o grupo utilizado, preservando o histórico mesmo que as faixas etárias sejam alteradas depois.", status: "Fase 2" },
  { id: "RF07", desc: "O sistema deve suportar perguntas de medida numérica (com unidade) e de critério observado (SIM, NÃO ou PARCIAL). Outros tipos (múltipla escolha, escala, texto livre) ficam para uma fase futura.", status: "Fase 2 (os 2 tipos da ficha)" },
  { id: "RF08", desc: "Ao salvar ou corrigir uma avaliação, o sistema deve calcular e armazenar o resultado de cada subgrupo conforme o tipo de cálculo: melhor tentativa (maior ou menor valor) ou estágio de desenvolvimento motor (Inicial, Elementar ou Maduro).", status: "Fase 2" },
  { id: "RF09", desc: "O sistema deve exibir um relatório de evolução do aluno, comparando os resultados de diferentes avaliações ao longo do tempo.", status: "Fase 3" },
  { id: "RF10", desc: "O sistema deve permitir autenticação do usuário por e-mail e senha, emitindo um token JWT.", status: "Fase 1" },
  { id: "RF11", desc: "O sistema deve permitir criar o acesso (usuário) de profissionais, somente pelo ADMIN, e de responsáveis, pelo ADMIN ou pelo profissional dos alunos do responsável.", status: "Fase 1" },
  { id: "RF12", desc: "O sistema deve permitir que um usuário do tipo Admin altere as informações de qualquer usuário do sistema.", status: "Fase 1" },
  { id: "RF13", desc: "O sistema deve permitir vincular um aluno a um ou mais responsáveis, e um responsável a um ou mais alunos (relação N:N). O responsável é um cadastro enxuto (nome e telefone), feito dentro do aluno.", status: "Fase 1" },
  { id: "RF14", desc: "O sistema deve permitir que o Responsável visualize as avaliações e o relatório de evolução apenas dos alunos vinculados a ele, sem permissão de edição.", status: "Fase 3" },
  { id: "RF15", desc: "O sistema deve manter cadastros de referência geográfica (País, Estado, Cidade) para uso nos endereços de alunos.", status: "Fase 1 (importados do IBGE)" },
  { id: "RF16", desc: "O sistema deve permitir cadastrar um ou mais endereços por aluno, preenchendo rua, bairro e cidade automaticamente a partir do CEP.", status: "Fase 1 (ViaCEP)" },
  { id: "RF17", desc: "O sistema deve permitir listar, consultar, corrigir e excluir as avaliações de um aluno; a correção recalcula os resultados.", status: "Fase 2" },
  { id: "RF18", desc: "O sistema deve calcular o IMC e a razão cintura/estatura (RCE) e classificar os resultados pelas tabelas de referência por idade e sexo.", status: "Fase 3" },
];

const RNF = [
  { id: "RNF01", desc: "O sistema deve ser implementado como uma aplicação web, com backend e frontend desacoplados (revisão do requisito original de aplicativo mobile Android/iOS)." },
  { id: "RNF02", desc: "O backend deve ser desenvolvido em Java 17+ com Spring Boot 4 (Spring Web MVC, Spring Data JPA, Spring Security com OAuth2 Resource Server), utilizando Maven como ferramenta de build." },
  { id: "RNF03", desc: "O frontend deve ser desenvolvido em React, consumindo o backend via API REST." },
  { id: "RNF04", desc: "O banco de dados utilizado deve ser o PostgreSQL." },
  { id: "RNF05", desc: "A autenticação deve ser feita via JWT, emitido a partir da entidade Usuario." },
  { id: "RNF06", desc: "O sistema deve funcionar como uma base reaproveitável: cada empresa cliente executa sua própria instância, sem compartilhamento de dados entre instâncias (não multi-tenant)." },
  { id: "RNF07", desc: "O sistema requer conexão com a internet para funcionar (inclusive para a carga inicial do IBGE e para a busca de CEP)." },
  { id: "RNF08", desc: "A API deve ser documentada e testável pelo navegador (Swagger / OpenAPI)." },
];

const RC = [
  { id: "RC01", desc: "Somente ADMIN e Profissional podem cadastrar e editar alunos, e o profissional só acessa os próprios alunos (e os endereços, responsáveis e avaliações deles).", status: "Confirmado" },
  { id: "RC02", desc: "Os cadastros de referência geográfica (País, Estado, Cidade) devem ser somente leitura para os demais perfis de usuário.", status: "Confirmado" },
  { id: "RC03", desc: "O campo Aluno.tpServico deve indicar a frequência semanal de aulas contratada pelo aluno (ex.: 1x/semana, 2x/semana, diária), como um enum simples — sem depender de uma estrutura completa de Aula/Contrato.", status: "Confirmado" },
  { id: "RC04", desc: "O sistema deve avisar os responsáveis sobre o horário de aula com 1 hora de antecedência.", status: "Fase futura (fora do MVP)" },
  { id: "RC05", desc: "O sistema deve permitir o controle de exercícios realizados em aula.", status: "Fase futura (fora do MVP)" },
  { id: "RC06", desc: "O sistema deve permitir o controle do contrato do aluno.", status: "Fase futura (fora do MVP)" },
  { id: "RC07", desc: "O sistema deve possuir uma versão mobile (Android/iOS).", status: "Fase futura (fora do MVP)" },
  { id: "RC08", desc: "O conteúdo das fichas de avaliação pode ser licenciado: textos dos critérios e tabelas de referência são cadastrados na instância e nunca constam no código-fonte nem no repositório.", status: "Confirmado" },
  { id: "RC09", desc: "Estágio motor por habilidade: 2 ou mais NÃO = Inicial; nenhum NÃO e no máximo 1 PARCIAL = Maduro; demais casos = Elementar. A combinação de até 1 NÃO com 3 ou mais PARCIAL não é coberta pela regra original e foi tratada como Elementar.", status: "Confirmado (lacuna provisória)" },
  { id: "RC10", desc: "A estrutura já usada em avaliações é protegida: pergunta com respostas não pode ser excluída nem trocar de tipo, e subgrupo com respostas não pode trocar de cálculo.", status: "Confirmado" },
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
        p("Este documento consolida os requisitos funcionais, não funcionais e complementares do Impulso, sistema de controle de avaliações físico/motoras para um programa infantil de avaliação física/motora. Os requisitos foram levantados a partir de uma versão inicial e reconciliados com decisões tomadas ao longo do desenvolvimento (troca de plataforma mobile para web, estrutura de avaliação cadastrável Grupo/Subgrupo/Pergunta com resultado por subgrupo, e definição do escopo do MVP)."),
        p("A coluna Situação indica em que fase cada requisito foi entregue. As Fases 1 (cadastros) e 2 (módulo de avaliação) estão concluídas; as linhas destacadas ainda não foram entregues."),

        h1("1. Requisitos Funcionais"),
        reqTable(RF, [1100, 6200, 2200], ["ID", "Descrição", "Situação"]),

        h1("2. Requisitos Não Funcionais"),
        reqTable(RNF, [1200, 8300], ["ID", "Descrição"]),

        h1("3. Requisitos Complementares"),
        p("Requisitos de regra de negócio, restrições e funcionalidades adicionais. Itens marcados como \"Fase futura\" estão fora do escopo do MVP."),
        reqTable(RC, [1100, 6200, 2200], ["ID", "Descrição", "Status"]),

        h1("4. Decisões de Escopo Registradas"),
        bullet("Plataforma: sistema web (React + Spring Boot REST), não aplicativo mobile — RC07 fica para fase futura."),
        bullet("Aula, Horário (com notificação) e Contrato do aluno (RC04, RC05, RC06) ficam fora do MVP; o foco é o módulo de avaliações, que é a parte de maior complexidade de domínio."),
        bullet("O campo tpServico do Aluno é mantido no MVP como um enum simples de frequência semanal (RC03), sem exigir as entidades completas de Aula/Contrato."),
        bullet("A ficha de avaliação é cadastrável (Grupo > Subgrupo > Pergunta) em vez de fixa no código. Não existe uma tabela de questionário acima dos grupos: com um único programa de avaliação, o grupo da idade já define as perguntas."),
        bullet("As faixas etárias são cadastradas pelo ADMIN em cada Grupo, porque o manual da avaliação não as define."),
        bullet("O resultado de cada subgrupo (AvaliacaoResumo) é calculado ao salvar ou corrigir a avaliação e armazenado, não recalculado sob demanda — garante estabilidade do relatório de evolução caso a estrutura seja alterada no futuro."),
        bullet("Responsável é um cadastro enxuto (nome e um telefone), feito dentro do aluno; os endereços pertencem ao aluno."),
        bullet("IMC, RCE e a classificação pelas tabelas de idade e sexo (RF18) ficam para a Fase 3, junto com o relatório de evolução; o sexo do aluno já é registrado desde a Fase 2."),
        bullet("Os testes automatizados dos critérios de aceite foram adiados; os cenários foram verificados com testes de ponta a ponta durante o desenvolvimento."),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  require("fs").writeFileSync(SAIDA, buffer);
  console.log("OK: " + SAIDA);
});
