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
function bullet(text) { return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 60 } }); }

function layerTable(layerName, note, classes) {
  return new Table({
    width: { size: 9500, type: WidthType.DXA },
    columnWidths: [2400, 7100],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 2400, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: layerName, bold: true, color: "FFFFFF" })] })],
          }),
          new TableCell({
            width: { size: 7100, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: "Responsabilidade", bold: true, color: "FFFFFF" })] })],
          }),
        ],
      }),
      ...classes.map(
        ([name, desc], idx) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 2400, type: WidthType.DXA },
                shading: idx % 2 === 1 ? { type: ShadingType.CLEAR, fill: "F2F2F2" } : undefined,
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph({ children: [new TextRun({ text: name, font: "Consolas", size: 19 })] })],
              }),
              new TableCell({
                width: { size: 7100, type: WidthType.DXA },
                shading: idx % 2 === 1 ? { type: ShadingType.CLEAR, fill: "F2F2F2" } : undefined,
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: [new Paragraph({ children: [new TextRun({ text: desc })] })],
              }),
            ],
          })
      ),
    ],
  });
}

const modelClasses = [
  ["Pais, Estado, Cidade", "Entidades de referência geográfica (somente leitura para Profissional/Responsável)."],
  ["Usuario", "Credenciais e tipo de acesso (ADMIN, PROFISSIONAL, RESPONSAVEL)."],
  ["Profissional, Responsavel", "Dados pessoais específicos de cada perfil, associados 1:1 a um Usuario."],
  ["Empresa", "Empresa cliente à qual o Profissional pertence."],
  ["Aluno, Endereco, Telefone", "Cadastro do aluno e seus dados de contato/endereço."],
  ["Questionario, Pergunta, OpcaoPergunta", "Estrutura de avaliação por faixa etária, com perguntas tipadas (5 tipos) e opções para múltipla escolha."],
  ["Avaliacao, Resposta", "Uma aplicação de um Questionario a um Aluno e as respostas individuais a cada Pergunta."],
  ["AvaliacaoResumo", "Score agregado por categoria/habilidade, calculado e persistido no momento da resposta ao checklist."],
  ["TipoUsuarioEnum, TipoServicoEnum, TipoPerguntaEnum", "Enums de domínio."],
];

const repositoryClasses = [
  ["AlunoRepository", "CRUD de Aluno + consultas por profissional/responsável."],
  ["ProfissionalRepository, ResponsavelRepository, UsuarioRepository", "Persistência de perfis de acesso."],
  ["QuestionarioRepository, PerguntaRepository", "Consulta de questionários por faixa etária e suas perguntas."],
  ["AvaliacaoRepository, RespostaRepository, AvaliacaoResumoRepository", "Persistência das avaliações, respostas e resumos calculados."],
  ["PaisRepository, EstadoRepository, CidadeRepository", "Dados de referência geográfica."],
];

const serviceClasses = [
  ["AuthService", "Autentica usuário (email/senha) e emite o token JWT."],
  ["UsuarioService", "Cadastro de usuários; permite que Admin altere dados de qualquer usuário."],
  ["AlunoService", "Regras de cadastro do aluno, vínculo com responsáveis e com o profissional."],
  ["QuestionarioService", "Seleciona o Questionario aplicável a um aluno conforme a idade no momento da avaliação."],
  ["AvaliacaoService", "Orquestra o registro de uma avaliação: salva as respostas e aciona o cálculo do AvaliacaoResumo por categoria."],
  ["RelatorioEvolucaoService", "Monta o relatório de evolução do aluno comparando avaliações ao longo do tempo."],
];

const controllerClasses = [
  ["AuthController", "POST /auth/login — autenticação e emissão de token."],
  ["UsuarioController", "Endpoints de gestão de usuários (Admin)."],
  ["ProfissionalController", "CRUD de profissionais."],
  ["AlunoController", "CRUD de alunos e vínculo com responsáveis."],
  ["QuestionarioController", "Consulta de questionários e suas perguntas."],
  ["AvaliacaoController", "Registro de avaliações e consulta do histórico de um aluno."],
  ["RelatorioController", "Consulta do relatório de evolução (Profissional e Responsável)."],
];

const securityClasses = [
  ["SecurityConfig", "Configuração de segurança do Spring (filtros, regras de autorização por perfil)."],
  ["JwtUtil", "Geração e validação do token JWT."],
  ["JwtAuthenticationFilter", "Filtro que intercepta requisições e valida o token JWT."],
  ["UserDetailsServiceImpl", "Carrega o Usuario para o mecanismo de autenticação do Spring Security."],
];

async function main() {
  const imgBuf = fs.readFileSync("classes.png");
  const dims = sizeOf(imgBuf);
  const maxWidthPt = 620;
  const scale = maxWidthPt / dims.width;

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
            children: [new TextRun({ text: "Plano de Classes", size: 30 })],
          }),
          p("Este documento apresenta o modelo de classes de domínio e a organização do backend em camadas (Spring Boot: controller → service → repository → model, com um módulo transversal de segurança)."),

          h1("1. Diagrama de Classes de Domínio"),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new ImageRun({
                data: imgBuf,
                transformation: { width: maxWidthPt, height: dims.height * scale },
                type: "png",
              }),
            ],
          }),

          h1("2. Organização em Camadas"),
          p("O backend segue a arquitetura padrão de camadas do Spring Boot. Cada camada depende apenas da camada imediatamente abaixo, e a camada de segurança atravessa todas as requisições antes de chegarem aos controllers."),

          h2("2.1 model"),
          layerTable("Classe(s)", "", modelClasses),

          h2("2.2 repository"),
          layerTable("Classe", "", repositoryClasses),

          h2("2.3 service"),
          layerTable("Classe", "", serviceClasses),

          h2("2.4 controller"),
          layerTable("Classe", "", controllerClasses),

          h2("2.5 security (transversal)"),
          layerTable("Classe", "", securityClasses),

          h1("3. Observações"),
          bullet("Cada Controller expõe e recebe DTOs próprios (request/response), nunca as entidades JPA diretamente — evita acoplar o contrato da API ao modelo de persistência."),
          bullet("AvaliacaoService é o ponto que concentra a regra mais sensível do domínio: ao salvar as respostas de um checklist, calcula e persiste o AvaliacaoResumo por categoria, em vez de recalculá-lo sob demanda."),
          bullet("QuestionarioService resolve, no momento do registro da avaliação, qual Questionario corresponde à idade atual do aluno — a Avaliacao então guarda essa referência de forma permanente (snapshot)."),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(process.argv[2], buffer);
  console.log("OK: " + process.argv[2]);
}

main().catch((e) => { console.error(e); process.exit(1); });
