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

// Linhas ainda não entregues (pendentes ou de fase futura) ficam destacadas.
function pendente(status) {
  const s = (status || "").toLowerCase();
  return s.includes("futura") || s.includes("pendente");
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
  { id: "RF01", desc: "O sistema deve permitir manter (cadastrar, consultar, editar e inativar) alunos.", status: "Fase 1 (inativar entregue depois da Fase 3)" },
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
  { id: "RF18", desc: "O sistema deve calcular o IMC e a razão cintura/estatura (RCE) e classificar os resultados pelas tabelas de referência por idade e sexo.", status: "Fase 3 (tabelas cadastradas pelo ADMIN)" },
  { id: "RF19", desc: "O sistema deve permitir que o ADMIN veja todos os acessos da escola (admins, profissionais e responsáveis) numa lista, com busca e filtro por perfil, e cadastre outros administradores.", status: "Fases 4 e 5" },
  { id: "RF20", desc: "O sistema deve permitir, pela linha de comando do servidor, cadastrar uma escola nova (banco, estrutura, geografia, empresa e primeiro admin), adotar um banco já existente e redefinir a senha de um acesso.", status: "Fase 5" },
  { id: "RF21", desc: "O sistema deve permitir montar a ficha de uma escola sem estrutura a partir de uma planilha (grupos, testes, perguntas e tabelas de referência), conferindo a planilha inteira antes de gravar.", status: "Fase 6" },
  { id: "RF22", desc: "Uma escola nova deve nascer com a ficha da escola modelo (grupos, subgrupos, perguntas e faixas), sem alunos, avaliações nem usuários dela.", status: "Fase 6" },
  { id: "RF23", desc: "A avaliação deve registrar, de forma opcional, o local e a duração da sessão (em minutos), como no cabeçalho das fichas de observação.", status: "Fase 6" },
];

const RNF = [
  { id: "RNF01", desc: "O sistema deve ser implementado como uma aplicação web, com backend e frontend desacoplados (revisão do requisito original de aplicativo mobile Android/iOS)." },
  { id: "RNF02", desc: "O backend deve ser desenvolvido em Java 17+ com Spring Boot 4 (Spring Web MVC, Spring Data JPA, Spring Security com OAuth2 Resource Server), utilizando Maven como ferramenta de build." },
  { id: "RNF03", desc: "O frontend deve ser desenvolvido em React com TypeScript e Material UI, consumindo o backend via API REST." },
  { id: "RNF04", desc: "O banco de dados utilizado deve ser o PostgreSQL." },
  { id: "RNF05", desc: "A autenticação deve ser feita via JWT, emitido a partir da entidade Usuario." },
  { id: "RNF06", desc: "Um único backend atende várias escolas (Modelo 2): cada escola tem o próprio banco de dados, todas acessam pelo mesmo endereço e a escola é identificada pelo e-mail no login. Um banco central guarda só a lista de escolas e de logins. (Revisão do requisito original de uma instância por cliente.)" },
  { id: "RNF07", desc: "O sistema requer conexão com a internet para funcionar (inclusive para a carga inicial do IBGE e para a busca de CEP)." },
  { id: "RNF08", desc: "A API deve ser documentada e testável pelo navegador (Swagger / OpenAPI), com a documentação desligada em produção." },
  { id: "RNF09", desc: "Bloquear um acesso ou trocar a senha deve encerrar na hora as sessões abertas; o token vale 8 horas." },
  { id: "RNF10", desc: "O login deve travar por 15 minutos depois de 5 senhas erradas seguidas, sem revelar se o e-mail existe." },
  { id: "RNF11", desc: "A estrutura dos bancos deve ser versionada (Flyway) e aplicada automaticamente no banco central e no de cada escola quando o backend sobe." },
  { id: "RNF12", desc: "O sistema deve rodar em hospedagem sem custo no começo, com a aplicação e os bancos na mesma região, e as credenciais apenas em variáveis de ambiente do servidor." },
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
  { id: "RC10", desc: "A estrutura já usada em avaliações é protegida: pergunta com respostas não pode ser excluída nem trocar de tipo, e subgrupo com respostas não pode trocar de cálculo. Subgrupo com faixas de classificação não pode ser excluído.", status: "Confirmado" },
  { id: "RC11", desc: "As medidas do cadastro do aluno (peso, estatura e cintura) são as mais recentes: a ficha da avaliação vem preenchida com elas, e só a avaliação mais nova do aluno as atualiza. Estatura e cintura aceitam centímetros ou metros (valor abaixo de 3 é tratado como metro).", status: "Confirmado" },
  { id: "RC12", desc: "Cada faixa de classificação vale para um sexo e uma faixa de idade e diz: a partir de tal valor, o resultado recebe tal classificação. Não podem existir duas faixas com o mesmo início, para o mesmo indicador e sexo, com idades que se cruzam.", status: "Confirmado" },
  { id: "RC13", desc: "O e-mail de login é único no sistema inteiro (sem diferença de maiúsculas): uma pessoa com acesso em duas escolas usa um e-mail em cada uma.", status: "Confirmado" },
  { id: "RC14", desc: "Ninguém bloqueia o próprio acesso, e cada escola mantém sempre pelo menos um administrador ativo.", status: "Confirmado" },
  { id: "RC15", desc: "LGPD: o consentimento dos responsáveis é colhido fora do sistema (por exemplo, na matrícula), os dados são mantidos para consulta (o aluno é inativado, não apagado), e política de privacidade, termo e contratos ficam fora do sistema, com validação jurídica.", status: "Confirmado (validar com advogado)" },
  { id: "RC16", desc: "Nas tabelas de referência importadas por planilha, o valor que cai num buraco ou numa sobreposição entre dois níveis fica no nível de valores menores (arredonda para baixo).", status: "Confirmado" },
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
        p("A coluna Situação indica em que fase cada requisito foi entregue. As Fases 1 (cadastros), 2 (módulo de avaliação), 3 (evolução, medidas e classificação), 4 (frontend), 5 (segurança e vários clientes) e 6 (no ar, importação da ficha e escola modelo) estão concluídas, e o sistema está no ar. As linhas destacadas ainda não foram entregues."),

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
        bullet("Peso, estatura e cintura ficam no cadastro do aluno e em cada avaliação (RC11). O IMC e a RCE são calculados a partir das medidas da avaliação, sem coluna própria no banco."),
        bullet("As tabelas de referência viram faixas cadastradas pelo ADMIN (RC12), e a classificação é calculada na consulta, não gravada: corrigir uma faixa vale também para as avaliações antigas."),
        bullet("O relatório de evolução junta os subgrupos de grupos diferentes pelo nome e pelo tipo de cálculo, então o mesmo teste segue numa única série quando o aluno muda de faixa etária."),
        bullet("O responsável consulta, só para leitura, os dados básicos, as avaliações e a evolução dos filhos (RF14); não vê endereços nem os outros responsáveis do aluno."),
        bullet("Inativar um aluno tira ele da lista padrão e impede ficha e avaliação nova, mas mantém o histórico (avaliações e evolução) visível, inclusive para o responsável. Admin e o profissional do aluno podem inativar e reativar."),
        bullet("Os testes automatizados dos critérios de aceite foram adiados; os cenários foram verificados com testes de ponta a ponta durante o desenvolvimento."),
        bullet("Modelo 2 (RNF06): um backend para várias escolas, um banco por escola e um endereço único; a escola sai do e-mail no login, por isso o e-mail é único no sistema inteiro (RC13). Uma escola nova é cadastrada por comando no servidor (RF20)."),
        bullet("A estrutura dos bancos passou a ser versionada com Flyway (RNF11): o antigo db/schema.sql virou a versão 1, e cada mudança nova é um arquivo numerado aplicado em todos os bancos."),
        bullet("LGPD (RC15): sem registro de consentimento e sem exclusão definitiva no sistema. Ficam para depois o aviso de privacidade dentro do sistema, o registro de quem fez o quê e o prazo de guarda."),
        bullet("Hospedagem (RNF12): site e API no Render e bancos no Neon, os dois em Virgínia (EUA), no plano gratuito. Nenhum dos dois oferece região no Brasil sem custo; com app e banco juntos, só a ida do navegador até o servidor cruza o continente, uma vez por clique. Hospedar no Brasil fica para quando houver cliente pagando."),
        bullet("A ficha licenciada (RC08) entra pela planilha de importação, preenchida pela própria escola (RF21): o conteúdo vai do arquivo dela direto para o banco dela, sem passar pelo código nem pelo repositório. Escolas novas recebem uma cópia da ficha da escola modelo (RF22)."),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  require("fs").writeFileSync(SAIDA, buffer);
  console.log("OK: " + SAIDA);
});
