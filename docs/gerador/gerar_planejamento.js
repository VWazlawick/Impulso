const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  AlignmentType, ShadingType, Table, TableRow, TableCell, WidthType
} = require("docx");
const fs = require("fs");
const imageSizeMod = require("image-size");
const sizeOf = imageSizeMod.imageSize || imageSizeMod.default || imageSizeMod;

const HEADER_BG = "1F3864";

function h1(text) { return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 150 } }); }
function h2(text) { return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }); }
function p(text) { return new Paragraph({ children: [new TextRun({ text })], spacing: { after: 120 } }); }
function bullet(text, opts = {}) { return new Paragraph({ children: [new TextRun({ text, ...opts })], bullet: { level: 0 }, spacing: { after: 60 } }); }

function simpleTable(headers, rows, widths) {
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((hd, i) =>
          new TableCell({
            width: { size: widths[i], type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: hd, bold: true, color: "FFFFFF" })] })],
          })
        ),
      }),
      ...rows.map(
        (r, idx) =>
          new TableRow({
            children: r.map((cellText, i) =>
              new TableCell({
                width: { size: widths[i], type: WidthType.DXA },
                shading: idx % 2 === 1 ? { type: ShadingType.CLEAR, fill: "F2F2F2" } : undefined,
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph({ children: [new TextRun({ text: cellText })] })],
              })
            ),
          })
      ),
    ],
  });
}

const backlog = [
  ["Fase 1", "Base do backend: entidades, repositórios, autenticação JWT, CRUD de Usuario/Profissional/Aluno.", "RF01–RF03, RF10–RF13, RNF02, RNF04, RNF05"],
  ["Fase 2", "Módulo de avaliação: Questionario/Pergunta/OpcaoPergunta, registro de Avaliacao/Resposta, cálculo do AvaliacaoResumo.", "RF04–RF08"],
  ["Fase 3", "Relatório de evolução do aluno e telas de consulta para o Responsável.", "RF09, RF14"],
  ["Fase 4", "Frontend React consumindo a API (telas de cadastro, avaliação e relatório).", "RNF01, RNF03"],
  ["Fase 5 (futura)", "Aula/Horário com notificação, Contrato do aluno, versão mobile.", "RC04–RC07"],
];

const setupSteps = [
  "Instalar Java 17+, Maven, Node.js e PostgreSQL localmente.",
  "Criar o banco de dados PostgreSQL e executar o script DDL do documento Planejamento_Banco_de_Dados.docx.",
  "Configurar as credenciais do banco em application.properties (ou variáveis de ambiente) do backend Spring Boot.",
  "Rodar o backend com `mvn spring-boot:run` e validar os endpoints via Postman/Insomnia.",
  "Rodar o frontend React com `npm install` seguido de `npm start`, apontando para a URL da API.",
];

async function main() {
  const archBuf = fs.readFileSync("arch.png");
  const archDims = sizeOf(archBuf);
  const archWidth = 560;
  const archHeight = archDims.height * (archWidth / archDims.width);

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [
      {
        properties: { page: { size: { width: 12240, height: 15840 } } },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: "Impulso", bold: true, size: 44, color: HEADER_BG })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: "Documentação de Planejamento", size: 30 })],
          }),

          h1("1. Visão Geral"),
          p("Impulso é um sistema de controle de avaliações físico-motoras para um programa infantil de avaliação física/motora. O sistema permite que profissionais cadastrem alunos, apliquem avaliações estruturadas (dimensão corporal, aptidão física e aptidão motora) e acompanhem a evolução de cada aluno ao longo do tempo. Responsáveis (pais) têm acesso somente à visualização das avaliações e do relatório de evolução dos alunos vinculados a eles."),
          p("Este é um projeto pessoal/portfólio, usado também como estudo de Spring Boot e React, com ritmo de desenvolvimento de aproximadamente 1 hora por dia — por isso o roadmap é dividido em fases pequenas."),

          h1("2. Escopo"),
          h2("2.1 Dentro do escopo (MVP)"),
          bullet("Cadastro e manutenção de alunos, profissionais e usuários (Admin, Profissional, Responsável)."),
          bullet("Aplicação de avaliações estruturadas por faixa etária (Questionario), com perguntas de 5 tipos diferentes."),
          bullet("Cálculo e armazenamento do score resumido por categoria/habilidade a cada avaliação."),
          bullet("Relatório de evolução do aluno entre avaliações."),
          bullet("Autenticação via e-mail/senha com JWT, e controle de acesso por perfil."),
          h2("2.2 Fora do escopo nesta fase"),
          bullet("Aula, Horário com notificação automática e Contrato do aluno — adiados para uma fase futura (ver Roadmap)."),
          bullet("Aplicativo mobile Android/iOS — o sistema é web nesta fase."),

          h1("3. Modelo de Negócio"),
          bullet("O sistema é uma base reaproveitável: cada empresa cliente executa sua própria instância (não é multi-tenant com dados compartilhados)."),
          bullet("Perfis de usuário: Profissional (cadastra/edita alunos, questionários, avaliações), Responsável (somente visualização) e Admin (altera dados de qualquer usuário)."),
          bullet("Um aluno pode ter mais de um responsável e vice-versa (relação N:N)."),

          h1("4. Arquitetura"),
          p("Aplicação web com frontend e backend desacoplados, comunicando-se via API REST."),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new ImageRun({ data: archBuf, transformation: { width: archWidth, height: archHeight }, type: "png" })],
          }),
          bullet("Backend: Java 17+, Spring Boot 3.x (Spring Web, Spring Data JPA, Spring Security), Maven."),
          bullet("Frontend: React, consumindo a API REST do backend."),
          bullet("Banco de dados: PostgreSQL (ver Planejamento_Banco_de_Dados.docx para o modelo completo)."),
          bullet("Camadas do backend: controller → service → repository → model, com segurança (JWT) transversal (ver Plano_de_Classes.docx)."),

          h1("5. Backlog por Fase"),
          simpleTable(
            ["Fase", "Entrega", "Requisitos relacionados"],
            backlog,
            [1500, 5500, 2500]
          ),

          h1("6. Setup do Ambiente de Desenvolvimento"),
          ...setupSteps.map((s, i) => bullet(`${i + 1}. ${s}`)),

          h1("7. Roadmap"),
          p("Dado o ritmo de estudo de aproximadamente 1 hora por dia, o roadmap segue a ordem das fases do backlog (seção 5), uma de cada vez, sem paralelismo. A Fase 5 (Aula/Contrato/Mobile) só é revisitada depois que o módulo de avaliação e o relatório de evolução estiverem funcionando de ponta a ponta."),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(process.argv[2], buffer);
  console.log("OK: " + process.argv[2]);
}

main().catch((e) => { console.error(e); process.exit(1); });
