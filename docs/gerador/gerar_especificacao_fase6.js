// Uso: node gerar_especificacao_fase6.js [saida.docx]  (padrão: ../Especificacao_Detalhada_Fase6.docx)
// Os testes, níveis, valores, e-mails e nomes de escola deste documento são fictícios. O conteúdo das
// fichas reais pode ser licenciado e nunca aparece aqui.
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { instance } = require("@viz-js/viz");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  AlignmentType, ShadingType, Table, TableRow, TableCell, WidthType, BorderStyle
} = require("docx");

const HEADER_BG = "1F3864";
const SAIDA = process.argv[2] || path.join(__dirname, "..", "Especificacao_Detalhada_Fase6.docx");

const blocos = [
  ["A", "No ar sem custo", "O site e a API ficam no Render e os bancos no Neon, os dois em Virgínia (EUA). Todos entram pelo mesmo endereço .onrender.com, com HTTPS.", "RNF12"],
  ["B", "Ficha por planilha", "A escola preenche uma planilha com grupos, testes, perguntas e tabelas de referência, e um comando grava tudo de uma vez, conferido antes.", "RF21, RC16"],
  ["C", "Escola modelo", "Uma escola nova já nasce com a ficha da escola modelo, sem precisar montar nada.", "RF22"],
  ["D", "Ajustes", "A avaliação guarda o local e a duração da sessão; o comando de escola nova recusa e-mail inválido; as cidades do IBGE são gravadas em lote.", "RF23, RF20"],
];

const hospedagem = [
  ["Site e API", "Render: Web Service gratuito, Docker, região Virginia (US East)", "O Dockerfile da raiz monta o frontend e o backend num jar só, e o backend serve o site. A porta vem da variável PORT. O serviço dorme depois de 15 minutos sem acesso, e o primeiro acesso depois disso leva cerca de 1 minuto. Cada push na main gera uma versão nova."],
  ["Bancos", "Neon: PostgreSQL gratuito, projeto impulso, região aws-us-east-1", "O impulso_central e um banco por escola (impulso_ + código), no mesmo servidor. A conexão é direta (sem o pooler) e com SSL. O banco também dorme quando fica parado e acorda no primeiro acesso."],
  ["Por que Virgínia", "Render e Neon na mesma região", "Cada clique faz várias consultas ao banco. Com o app e o banco juntos, só a ida do navegador até o servidor cruza o continente, uma vez por clique (cerca de 0,15 s). Com o app nos EUA e o banco em São Paulo, cada consulta cruzaria o continente (perto de 1 s por clique). O Render não tem região no Brasil, e nenhum dos dois troca a região depois."],
];

const variaveis = [
  ["SPRING_PROFILES_ACTIVE", "prod", "Liga o perfil de produção: sem Swagger, sem log de SQL e com os cabeçalhos do proxy do Render."],
  ["DATABASE_URL", "string direta do Neon", "postgresql://usuario:senha@servidor/banco?sslmode=require. O banco que vem na URL é ignorado: o backend usa o impulso_central e o banco de cada escola. A string com pooler (-pooler) não serve."],
  ["JWT_SECRET", "chave aleatória nova", "Assinatura dos tokens. Diferente da usada no computador; trocar derruba todos os logins."],
];

const perfilNeon = [
  ["Onde fica a conexão", "O comando neon link grava a conexão no .env.local da pasta impulso. O .gitignore e o .dockerignore deixam esse arquivo (e o .neon) fora do Git e da imagem."],
  ["Como usar", "Uma run config do IntelliJ com neon em Active profiles: o backend lê o .env.local (na pasta de onde roda ou na de cima) e os comandos passam a agir no banco do site."],
  ["Sem o arquivo", "O backend para na subida com Could not resolve placeholder 'DATABASE_URL', em vez de usar sem avisar o PostgreSQL do computador."],
  ["Sem o perfil", "Tudo vai para o PostgreSQL do computador, como antes. Por isso a nova senha de um acesso do site precisa de uma run config com o perfil neon."],
];

const abas = [
  ["Grupos", "Grupo, Idade mínima, Idade máxima", "Idades em anos completos; as faixas não podem se sobrepor."],
  ["Testes", "Teste, Grupos, Resultado", "Um teste por linha, descrito uma vez. Grupos: os nomes da aba Grupos, separados por vírgula; o teste é criado em cada um. Resultado: Maior valor, Menor valor, Estágio ou Nenhum."],
  ["Perguntas", "Teste, Pergunta, Resposta, Unidade", "Uma linha por tentativa (Número, com unidade) ou por critério (Sim/Não/Parcial), na ordem das linhas. O número no começo da linha é ignorado, e linhas só com o número também: dá para colar uma lista numerada."],
  ["Tabelas", "Tabela, Vale para, Teste, Níveis", "Um código, a que a tabela se refere (Teste, IMC ou RCE), o teste (com Resultado Maior ou Menor valor) e os níveis na ordem da linha, separados por ponto e vírgula. Uma tabela só por teste."],
  ["Linhas das tabelas", "Tabela, Sexo, Linha", "Uma linha por idade (ou faixa, como 6-8) e sexo, colada como está: a idade e depois o valor de cada nível."],
];

const regrasLinha = [
  ["< 100 ou <= 100", "Só no primeiro nível, que sempre começa em 0."],
  ["100 - 149", "Níveis do meio: o nível começa no primeiro número."],
  [">= 150 ou > 149", "Só no último nível. \"> 149\" começa no valor seguinte pelas casas decimais (150; \"> 5,50\" começa em 5,51)."],
  ["um valor só", "Tabela de dois níveis: o segundo começa nele."],
  ["Buraco ou sobreposição", "Arredonda para baixo (RC16): o valor da borda fica no nível de valores menores. Na sobreposição, o nível seguinte passa a começar logo depois do fim do anterior. A importação avisa cada caso."],
  ["Idades e grupos", "As faixas de um teste são gravadas em cada grupo dele, só com as idades daquele grupo (a linha 6-8 vira 6-6 num grupo de 4 a 6 anos e 7-8 num de 7 a 9)."],
];

const exemploLinha = [
  ["6 <= 4,50  4,51 - 5,00  5,01 - 5,50  > 5,50", "Excelente; Bom; Regular; Fraco", "Idade 6: Excelente a partir de 0 · Bom a partir de 4,51 · Regular a partir de 5,01 · Fraco a partir de 5,51"],
  ["6-8 18,0", "Saudável; Risco", "Idades 6 a 8: Saudável a partir de 0 · Risco a partir de 18,0"],
  ["5 < 55  56 - 79  >= 80", "Fraco; Bom; Ótimo", "Idade 5: o 55 fica sem nível na linha e conta como Fraco (Bom a partir de 56)"],
];

const comandos = [
  ["--importar-estrutura --codigo --arquivo", "Grava a ficha de uma escola sem estrutura a partir da planilha. Confere tudo antes: se houver erro, lista todos (aba e linha) e não grava nada. Escola que já tem grupos ou faixas é recusada."],
  ["--novo-cliente ... (sem mudança nos argumentos)", "Agora também copia a ficha da escola modelo (app.clientes.modelo) e recusa um --admin-email inválido, com a mesma regra do cadastro de admin pela tela."],
  ["--novo-cliente ... --modelo=código", "Copia a ficha de outra escola em vez da modelo."],
  ["--novo-cliente ... --sem-modelo", "Cria a escola com a ficha vazia."],
];

const exemploComandos = [
  "Importar a ficha (escola sem estrutura):",
  "  --importar-estrutura --codigo=escola-abc --arquivo=\"C:\\caminho\\estrutura-avaliacao.xlsx\"",
  "",
  "Escola nova copiando a ficha de outra escola:",
  "  --novo-cliente --codigo=escola-xyz --nome=\"Escola XYZ\" --cnpj=11222333000181 --admin-email=dono@escolaxyz.com.br --modelo=escola-abc",
  "",
  "Para agir no banco do site: a mesma run config com neon em Active profiles.",
];

const configuracao = [
  ["app.banco.url", "${DATABASE_URL_UNPOOLED:${DATABASE_URL:}}", "Uma URL só no formato do Neon e do Render. Quando existe, vale no lugar de servidor, parâmetros, usuário e senha."],
  ["app.clientes.modelo", "escola-teste", "Escola modelo das escolas novas. Vazio = ficha vazia. Se a modelo não existe naquele servidor, a ficha também fica vazia."],
  ["server.port", "${PORT:8080}", "O Render informa a porta na variável PORT."],
  ["application-neon.properties", "spring.config.import do .env.local", "Perfil neon: conexão do Neon no computador (ver 2.3)."],
];

const criterios = [
  ["A", "No ar", "O serviço no Render com as três variáveis", "O admin da escola-teste entra pelo endereço .onrender.com", "Login e telas funcionando com os bancos do Neon"],
  ["A", "Perfil neon sem arquivo", "Nenhum .env.local por perto", "O backend sobe com o perfil neon", "Para com Could not resolve placeholder 'DATABASE_URL'"],
  ["A", "Cidades em lote", "Banco a 137 ms de distância", "Comando de escola nova", "Termina em cerca de 1 minuto (antes, uns 13), com as mesmas cidades do jeito antigo"],
  ["B", "Importação", "Escola sem estrutura e planilha certa", "--importar-estrutura", "Grupos, subgrupos, perguntas e faixas gravados de uma vez, na ordem da planilha, sem a numeração das listas"],
  ["B", "Planilha com erros", "Planilha com grupos sobrepostos, teste inexistente, linha com valores a menos...", "--importar-estrutura", "Todos os problemas listados com aba e linha; nada gravado"],
  ["B", "Estrutura existente", "Escola que já tem grupos", "--importar-estrutura", "Recusada; nada muda"],
  ["B", "Regra de borda", "Bom vai até 90 e Ótimo começa em 85", "Melhor tentativa 88", "Bom (Ótimo só a partir de 91)"],
  ["B", "Menor valor", "Ótimo até 4,50, Bom de 4,51 a 5,00, Fraco acima de 5,00", "Menor tempo 5,00", "Bom"],
  ["C", "Cópia da modelo", "A escola modelo com a ficha montada", "Comando de escola nova com --modelo", "Ficha igual à da modelo (mesma assinatura), sem alunos nem avaliações"],
  ["C", "Sem modelo", "--sem-modelo, ou modelo inexistente no servidor", "Comando de escola nova", "Escola criada com a ficha vazia e o motivo na saída"],
  ["D", "Local e duração", "Uma avaliação nova", "Local com espaços nas pontas e 45 minutos", "Guardados sem os espaços; a correção mostra e apaga; 0, mais de 600 minutos ou local com mais de 100 letras dão 400"],
  ["D", "E-mail do admin", "Um texto de exemplo esquecido no --admin-email", "Comando de escola nova", "Recusado: E-mail do admin inválido; nada é criado"],
];

const falta = [
  ["Importar a ficha da escola-teste no site", "Rodar --importar-estrutura com a planilha preenchida, numa run config com o perfil neon.", "Pendente"],
  ["Domínio próprio", "Hoje o endereço é o .onrender.com. Um domínio próprio entra quando houver escola usando.", "Fase 7"],
  ["Backup", "Cópia periódica de cada banco do Neon, criptografada.", "Fase 7"],
  ["Hospedagem no Brasil", "App e bancos juntos numa região do Brasil (só em plano pago).", "Fase 7"],
  ["Limite por IP", "Completar o limite de tentativas no servidor ou proxy (hoje é por e-mail, na memória do servidor).", "Fase 7"],
];

const tarefas = [
  ["1", "Dockerfile na raiz e backend servindo o site; perfil prod", "Concluída"],
  ["2", "Neon: projeto em Virgínia, impulso_central, conexão por DATABASE_URL e perfil neon", "Concluída"],
  ["3", "Render: Web Service Docker gratuito com as três variáveis", "Concluída"],
  ["4", "Cidades do IBGE gravadas em lote", "Concluída"],
  ["5", "Planilha modelo e importação da ficha (--importar-estrutura)", "Concluída"],
  ["6", "Escola modelo nas escolas novas (--modelo, --sem-modelo)", "Concluída"],
  ["7", "Local e duração da avaliação (V2), na API e nas telas", "Concluída"],
  ["8", "E-mail do primeiro admin conferido no comando", "Concluída"],
  ["9", "Importar a ficha da escola-teste no site", "Pendente"],
];

const dotHospedagem = `digraph Hospedagem {
  rankdir=LR; graph [fontname="Helvetica", nodesep=0.45, ranksep=0.7];
  node [fontname="Helvetica", fontsize=10, shape=box, style="filled,rounded", fontcolor="white"];
  edge [fontname="Helvetica", fontsize=9, color="#555555"];
  N [label="Navegador\\n(Brasil)", fillcolor="#7C5CD6"];
  subgraph cluster_va { label="Virgínia (EUA)"; fontname="Helvetica"; fontsize=11; color="#999999"; style=dashed;
    R [label="Render\\ncontainer Docker\\nsite + API (perfil prod)", fillcolor="#1F3864"];
    CE [label="Neon\\nimpulso_central", fillcolor="#548235", shape=cylinder];
    E [label="Neon\\num banco por escola", fillcolor="#548235", shape=cylinder]; }
  P [label="IntelliJ no computador\\ncomandos com o perfil neon", fillcolor="#833C0C"];
  N -> R [label=" HTTPS, 1 ida por clique "];
  R -> CE [label=" login "]; R -> E [label=" várias consultas\\n por clique "];
  P -> CE [style=dashed]; P -> E [style=dashed, label=" escola nova,\\n importação "];
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
        fundo: v === "Pendente" ? "FCE4D6" : v === "Fase 7" ? "EDEDED" : (idx % 2 ? "F2F2F2" : undefined),
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
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "Especificação Detalhada — Fase 6: No Ar, Ficha por Planilha e Escola Modelo", size: 30 })] }),
        p("A Fase 6 coloca o Impulso no ar sem custo: o site e a API rodam no Render e os bancos no Neon, os dois em Virgínia (EUA). Ela também traz a importação da ficha por planilha, para a escola não precisar cadastrar tela por tela, a cópia da ficha da escola modelo para as escolas novas, e dois ajustes: o local e a duração da avaliação, e a conferência do e-mail do primeiro admin. Tudo foi testado numa cópia do backend, com bancos de teste e dados inventados, antes de ir para o projeto."),

        h1("1. Blocos da Fase"),
        tabela(["Bloco", "Entrega", "O que muda para o usuário", "Requisito"], [700, 2000, 5600, 1200], blocos),

        h1("2. Hospedagem"),
        await imagem(viz, dotHospedagem, 620),
        tabela(["Peça", "Onde", "Detalhes"], [1500, 2600, 5400], hospedagem, { tamanho: 19 }),
        h2("2.1 Variáveis do serviço no Render"),
        p("São só três. Nenhuma credencial fica no código, no Git ou na imagem do Docker."),
        tabela(["Variável", "Valor", "Para que serve"], [2400, 1900, 5200], variaveis, { monoCols: [0], tamanho: 19 }),
        h2("2.2 Cidades do IBGE em lote"),
        p("Os comandos rodam no computador e falam com o Neon em Virgínia: cada ida e volta leva cerca de 137 ms. A carga da geografia gravava as 5.571 cidades uma por uma (o id gerado pelo banco impede o Hibernate de agrupar), o que levaria uns 13 minutos. Agora as cidades vão em lote, na mesma transação: o comando de escola nova termina em cerca de 1 minuto, com as mesmas cidades do jeito antigo."),
        h2("2.3 Perfil neon no computador"),
        tabela(["Assunto", "Como funciona"], [2200, 7300], perfilNeon, { tamanho: 19 }),
        p("O limite de tentativas de login fica na memória do servidor: reiniciar o serviço no Render (Manual Deploy → Restart service) zera os bloqueios."),

        h1("3. Ficha por Planilha"),
        p("A planilha modelo (estrutura-avaliacao.xlsx, com uma aba de instruções e exemplos fictícios) fica fora do repositório. A escola preenche com a própria ficha, e o comando --importar-estrutura grava tudo no banco dela. O conteúdo vai do arquivo da escola direto para o banco da escola, sem passar pelo código nem pelo Git (RC08). Linhas com \"(exemplo)\" na primeira coluna são ignoradas."),
        tabela(["Aba", "Colunas", "Regras"], [1700, 2600, 5200], abas, { tamanho: 19 }),
        h2("3.1 Como o sistema lê a linha de uma tabela"),
        tabela(["Formato", "Regra"], [2400, 7100], regrasLinha, { monoCols: [0], tamanho: 19 }),
        p("Exemplos (valores inventados):"),
        tabela(["Linha colada", "Níveis da tabela", "O que vira no sistema"], [3200, 2300, 4000], exemploLinha, { monoCols: [0], tamanho: 18 }),
        h2("3.2 Conferência antes de gravar"),
        p("A importação lê a planilha inteira e confere nomes, tipos, limites de tamanho, grupos e faixas de idade sobrepostos, perguntas que não combinam com o tipo de resultado (estágio só com Sim/Não/Parcial, maior e menor valor só com Número), testes sem perguntas, tabelas de testes sem valor numérico, linhas com valores a mais ou a menos, idades repetidas e valores fora de ordem. Qualquer erro: a lista completa, com aba e linha, e nada é gravado. Avisos (teste sem tabela, unidade faltando, borda ajustada, idades sem tabela) não impedem a importação e aparecem na saída."),
        p("A gravação é uma transação só, e só acontece numa escola sem estrutura (sem grupos nem faixas), para nunca misturar duas fichas. Grupos e subgrupos vão um a um; perguntas e faixas, em lote."),

        h1("4. Escola Modelo"),
        p("O comando de escola nova copia a ficha da escola modelo (app.clientes.modelo, hoje escola-teste): grupos, subgrupos, perguntas e faixas, inclusive as de IMC e RCE. Alunos, avaliações, usuários e empresa da modelo não são copiados. Se a modelo não existe naquele servidor (por exemplo, no PostgreSQL do computador) ou ainda não tem ficha, a escola nasce com a ficha vazia, e a saída diz o motivo."),
        tabela(["Argumentos", "O que faz"], [3600, 5900], comandos, { monoCols: [0], tamanho: 19 }),
        blocoCodigo(exemploComandos),

        h1("5. Local e Duração da Avaliação"),
        p("Como no cabeçalho das fichas de observação, a avaliação pode guardar onde foi feita e quanto tempo durou. Os dois são opcionais e valem só para a avaliação (não vão para o cadastro do aluno)."),
        tabela(["Onde", "O que mudou"], [2400, 7100], [
          ["Banco (V2)", "db/migration/V2__local_e_duracao_da_avaliacao.sql: ds_local VARCHAR(100) e nr_duracao INT (maior que zero, em minutos). Aplicada pelo Flyway em todos os bancos na subida."],
          ["API", "AvaliacaoRequest e AvaliacaoResponse ganham dsLocal (até 100 letras; em branco vira vazio) e nrDuracao (de 1 a 600 minutos). Fora disso: 400."],
          ["Telas", "Cartão Local e duração no começo da ficha (avaliação nova e correção) e etiquetas Local e Duração no detalhe da avaliação."],
        ], { tamanho: 19 }),

        h1("6. Configuração"),
        tabela(["Propriedade", "Valor", "Para que serve"], [2900, 3000, 3600], configuracao, { monoCols: [0, 1], tamanho: 18 }),

        h1("7. Critérios de Aceite"),
        p("Formato Dado / Quando / Então. Verificados numa cópia do backend com bancos de teste e uma planilha de dados inventados, junto com as 110 chamadas do frontend e um teste de ponta a ponta da avaliação (21 conferências)."),
        tabela(["Bloco", "Cenário", "Dado", "Quando", "Então"], [700, 1600, 2400, 2300, 2500], criterios, { tamanho: 18 }),

        h1("8. O que Falta"),
        tabela(["Item", "O que é", "Status"], [2500, 5500, 1500], falta),

        h1("9. Tarefas da Fase 6"),
        tabela(["#", "Tarefa", "Status"], [600, 7400, 1500], tarefas),
      ],
    }],
  });

  fs.writeFileSync(SAIDA, await Packer.toBuffer(doc));
  console.log("OK: " + SAIDA);
}

main().catch((e) => { console.error(e); process.exit(1); });
