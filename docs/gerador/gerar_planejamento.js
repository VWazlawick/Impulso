// Uso: node gerar_planejamento.js [saida.docx]  (padrão: ../Documentacao_Planejamento.docx)
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { instance } = require("@viz-js/viz");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  AlignmentType, ShadingType, Table, TableRow, TableCell, WidthType
} = require("docx");

const HEADER_BG = "1F3864";
const SAIDA = process.argv[2] || path.join(__dirname, "..", "Documentacao_Planejamento.docx");

function h1(text) { return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 150 } }); }
function h2(text) { return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }); }
function p(text) { return new Paragraph({ children: [new TextRun({ text })], spacing: { after: 120 } }); }
function bullet(text, opts = {}) { return new Paragraph({ children: [new TextRun({ text, ...opts })], bullet: { level: 0 }, spacing: { after: 60 } }); }

function simpleTable(headers, rows, widths) {
  const fundoSituacao = { "Concluída": "E2EFDA", "Próxima": "FCE4D6" };
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
            children: r.map((cellText, i) => {
              const fundo = fundoSituacao[cellText] || (idx % 2 === 1 ? "F2F2F2" : undefined);
              return new TableCell({
                width: { size: widths[i], type: WidthType.DXA },
                shading: fundo ? { type: ShadingType.CLEAR, fill: fundo } : undefined,
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph({ children: [new TextRun({ text: cellText })] })],
              });
            }),
          })
      ),
    ],
  });
}

const backlog = [
  ["Fase 1", "Base do backend: entidades, autenticação JWT, cadastros de usuários, profissionais, responsáveis e alunos, geografia importada do IBGE, endereços do aluno com busca de CEP (ViaCEP) e documentação Swagger.", "RF01–RF03, RF10–RF13, RF15, RF16", "Concluída"],
  ["Fase 2", "Módulo de avaliação: estrutura da ficha cadastrável (Grupo > Subgrupo > Pergunta), ficha do aluno pela idade, registro com cálculo dos resultados (melhor tentativa e estágio motor), consulta, correção e exclusão.", "RF04–RF08, RF17", "Concluída"],
  ["Fase 3", "Acesso do Responsável aos dados dos filhos (somente leitura), medidas do corpo no cadastro e na avaliação com IMC e RCE, relatório de evolução e classificação pelas faixas de idade e sexo cadastradas pelo ADMIN. Fecha o backend.", "RF09, RF14, RF18", "Concluída"],
  ["Fase 4", "Frontend React (TypeScript + Material UI) com todas as telas dos três perfis ligadas à API, e a aba Usuários com cadastro de administradores.", "RNF01, RNF03, RF19", "Concluída"],
  ["Fase 5", "Segurança (bloqueio vale na hora, limite de tentativas, perfil de produção) e vários clientes (Modelo 2): um backend, um banco por escola, login pelo e-mail, Flyway e comandos de cliente novo e nova senha.", "RNF06, RNF08–RNF11, RF20", "Concluída"],
  ["Fase 6", "Colocar no ar: hospedagem, domínio, HTTPS, backup e perfil de produção.", "—", "Próxima"],
  ["Fase 7 (futura)", "Aula/Horário com notificação, Contrato do aluno, versão mobile; aviso de privacidade, auditoria e prazo de guarda (LGPD).", "RC04–RC07, RC15", "Futura"],
];

const setupSteps = [
  "Instalar Java 17+, PostgreSQL, Node.js e o IntelliJ (ou usar o Maven Wrapper do projeto, mvnw).",
  "Criar no PostgreSQL o banco central impulso_central (vazio). As tabelas não são criadas à mão: o Flyway monta o banco central e o de cada escola quando o backend sobe.",
  "Definir as variáveis de ambiente DB_PASSWORD (senha do usuário postgres) e JWT_SECRET (chave de assinatura do token). Nenhum segredo fica no código.",
  "Cadastrar a primeira escola rodando o backend com --novo-cliente --codigo=... --nome=... --cnpj=... --admin-email=... (no IntelliJ, em Program arguments de uma cópia da run config). O comando cria o banco da escola, importa a geografia do IBGE (precisa de internet), cria a empresa e o primeiro admin, e mostra uma senha provisória.",
  "Rodar o backend pelo IntelliJ ou com mvnw spring-boot:run (mvnw.cmd no Windows) dentro da pasta backend, e testar a API pelo Swagger em http://localhost:8080/swagger-ui.html.",
  "Rodar o frontend: na pasta frontend, npm install e npm run dev (no PowerShell, npm.cmd), e abrir http://localhost:5173. Detalhes na Especificacao_Detalhada_Fase4.docx; os comandos de escola estão na Fase 5.",
];

const dotArquitetura = `digraph Arquitetura {
  rankdir=LR;
  graph [fontname="Helvetica", nodesep=0.5, ranksep=0.8];
  node [fontname="Helvetica", fontsize=13, shape=box, style="filled,rounded", fontcolor="white"];
  edge [fontname="Helvetica", fontsize=11, color="#555555"];

  subgraph cluster_instancia {
    label="Um backend para todas as escolas (Modelo 2)";
    style=dashed; color="#999999"; fontname="Helvetica-Oblique"; fontsize=11;
    Frontend [label="Frontend\\nReact + TypeScript\\n+ Material UI", fillcolor="#2E75B6"];
    Backend [label="Backend\\nSpring Boot 4 (Java 17)\\nAPI REST + Swagger", fillcolor="#1F3864"];
    Central [label="PostgreSQL\\nbanco central\\n(escolas e logins)", fillcolor="#548235"];
    DB [label="PostgreSQL\\num banco\\npor escola", fillcolor="#548235"];
    Security [label="Spring Security\\nJWT (resource server)", fillcolor="#833C0C", shape=note, fontsize=11];
  }
  IBGE [label="API do IBGE\\npaíses, estados e cidades", fillcolor="#7F7F7F"];
  ViaCEP [label="ViaCEP\\nbusca de CEP", fillcolor="#7F7F7F"];

  Frontend -> Backend [label="  REST/JSON  "];
  Backend -> Central [label="  login  "];
  Backend -> DB [label="  JPA (Flyway)  "];
  Security -> Backend [style=dashed, dir=back, label=" protege "];
  Backend -> IBGE [style=dashed, label=" carga por escola "];
  Backend -> ViaCEP [style=dashed, label=" consulta "];
}`;

async function main() {
  const viz = await instance();
  const svg = viz.renderString(dotArquitetura, { format: "svg" })
    .replace(/font-family="Helvetica,sans-Serif"/g, 'font-family="Arial"'); // Helvetica não existe no Windows; Arial tem as mesmas medidas
  const archBuf = await sharp(Buffer.from(svg), { density: 220 }).png().toBuffer();
  const archDims = await sharp(archBuf).metadata();
  const archWidth = 580;
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
          p("Impulso é um sistema de controle de avaliações físico-motoras para um programa infantil de avaliação física/motora. O administrador monta a ficha de avaliação de cada faixa etária; os profissionais cadastram alunos e responsáveis, registram as avaliações e o sistema calcula os resultados de cada teste e habilidade, permitindo acompanhar a evolução de cada aluno ao longo do tempo. Responsáveis (pais) acessam, só para leitura, os dados, as avaliações e a evolução dos alunos vinculados a eles."),
          p("Este é um projeto pessoal/portfólio, usado também como estudo de Spring Boot e React, com ritmo de desenvolvimento de aproximadamente 1 hora por dia — por isso o roadmap é dividido em fases pequenas. Situação atual: as Fases 1 (cadastros), 2 (módulo de avaliação), 3 (evolução, medidas e classificação), 4 (frontend) e 5 (segurança e vários clientes) estão concluídas; a próxima é colocar o sistema no ar (Fase 6)."),

          h1("2. Escopo"),
          h2("2.1 Dentro do escopo (MVP)"),
          bullet("Cadastro e manutenção de alunos (com endereços e busca de CEP), responsáveis, profissionais e acessos (Admin, Profissional, Responsável)."),
          bullet("Ficha de avaliação cadastrável por faixa etária (Grupo > Subgrupo > Pergunta), com perguntas numéricas (com unidade) e de critério observado (SIM, NÃO ou PARCIAL)."),
          bullet("Registro, consulta e correção de avaliações, com cálculo e armazenamento do resultado de cada subgrupo: melhor tentativa ou estágio motor."),
          bullet("Medidas do corpo (peso, estatura e cintura) com IMC e RCE, relatório de evolução do aluno e classificação dos resultados pelas faixas de idade e sexo."),
          bullet("Autenticação via e-mail/senha com JWT, e controle de acesso por perfil."),
          h2("2.2 Fora do escopo nesta fase"),
          bullet("Aula, Horário com notificação automática e Contrato do aluno — adiados para uma fase futura (ver Roadmap)."),
          bullet("Aplicativo mobile Android/iOS — o sistema é web nesta fase."),
          bullet("Tipos de pergunta além dos dois usados pela ficha (múltipla escolha, escala, texto livre)."),

          h1("3. Modelo de Negócio"),
          bullet("Um único backend atende várias escolas (Modelo 2): cada escola tem o próprio banco, todas entram pelo mesmo endereço e o e-mail de login diz de qual escola é a pessoa. Os dados de uma escola nunca se misturam com os de outra."),
          bullet("Perfis de usuário: Admin (cadastra profissionais, monta a ficha de avaliação e acessa todos os alunos), Profissional (cadastra e acompanha os próprios alunos, os responsáveis e as avaliações deles) e Responsável (somente visualização dos dados, das avaliações e da evolução dos filhos)."),
          bullet("Um aluno pode ter mais de um responsável e vice-versa (relação N:N)."),
          bullet("O conteúdo das fichas pode ser licenciado: é cadastrado no banco de cada escola e nunca fica no código-fonte."),

          h1("4. Arquitetura"),
          p("Aplicação web com frontend e backend desacoplados, comunicando-se via API REST. O backend consulta duas APIs públicas: a do IBGE, na primeira inicialização, para carregar a geografia, e o ViaCEP, para preencher endereços."),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new ImageRun({ data: archBuf, transformation: { width: archWidth, height: archHeight }, type: "png" })],
          }),
          bullet("Backend: Java 17, Spring Boot 4 (Spring Web MVC, Spring Data JPA, Spring Security com OAuth2 Resource Server), Maven, Lombok, Bean Validation e springdoc-openapi (Swagger)."),
          bullet("Frontend: React com TypeScript e Material UI, consumindo a API REST do backend (Especificacao_Detalhada_Fase4.docx)."),
          bullet("Banco de dados: PostgreSQL, com um banco central (escolas e logins) e um banco por escola. A estrutura é versionada com Flyway (backend/src/main/resources/db) e aplicada em todos os bancos quando o backend sobe (ver Planejamento_Banco_de_Dados.docx e Especificacao_Detalhada_Fase5.docx)."),
          bullet("Camadas do backend: controller → service → repository → model, com segurança (JWT) transversal e os clientes das APIs externas no pacote integracao (ver Plano_de_Classes.docx)."),

          h1("5. Backlog por Fase"),
          simpleTable(
            ["Fase", "Entrega", "Requisitos", "Situação"],
            backlog,
            [1300, 5000, 1900, 1300]
          ),

          h1("6. Setup do Ambiente de Desenvolvimento"),
          ...setupSteps.map((s, i) => bullet(`${i + 1}. ${s}`)),

          h1("7. Roadmap"),
          p("Dado o ritmo de estudo de aproximadamente 1 hora por dia, o roadmap segue a ordem das fases do backlog (seção 5), uma de cada vez, sem paralelismo. Cada fase começa com as decisões de regra de negócio e uma especificação detalhada (Especificacao_Detalhada_Fase1.docx a Especificacao_Detalhada_Fase5.docx) e é implementada em tarefas pequenas, conferidas com testes de ponta a ponta."),
          p("As Fases 1 a 5 estão concluídas: o backend atende o escopo do MVP, o frontend cobre os três perfis, e o sistema está pronto para várias escolas, com as correções de segurança da revisão. A próxima é colocar o sistema no ar (Fase 6), de preferência sem custo no começo. Os testes automatizados dos critérios de aceite foram adiados por decisão. A Fase 7 (Aula/Contrato/Mobile e os itens de LGPD dentro do sistema) só é revisitada depois que o sistema estiver no ar."),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(SAIDA, buffer);
  console.log("OK: " + SAIDA);
}

main().catch((e) => { console.error(e); process.exit(1); });
