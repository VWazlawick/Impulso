// Uso: node gerar_especificacao_fase4.js [saida.docx]  (padrão: ../Especificacao_Detalhada_Fase4.docx)
// Os exemplos de tela e de dados são fictícios.
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { instance } = require("@viz-js/viz");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  AlignmentType, ShadingType, Table, TableRow, TableCell, WidthType, BorderStyle
} = require("docx");

const HEADER_BG = "1F3864";
const SAIDA = process.argv[2] || path.join(__dirname, "..", "Especificacao_Detalhada_Fase4.docx");

const blocos = [
  ["A", "Projeto e visual", "React com TypeScript e Material UI, num visual divertido em tons bebê (lavanda e amarelo), pensado para professores de crianças.", "RNF01, RNF03"],
  ["B", "Telas dos três perfis", "Todas as telas do ADMIN, do profissional e do responsável, cada uma ligada à sua rota da API.", "RF01–RF18"],
  ["C", "Ligação com o backend", "Cliente HTTP único (api.ts) com o token em todo pedido, mensagens de erro do backend na tela e volta ao login quando a sessão acaba.", "RNF05"],
  ["D", "Usuários", "Aba que lista todos os acessos (admins, profissionais e responsáveis) e cadastra outros administradores.", "RF12, RF19"],
];

const stack = [
  ["React 19 + Vite 8", "Telas e servidor de desenvolvimento (porta 5173), com o proxy /api → localhost:8080."],
  ["TypeScript 6", "Tipos iguais aos DTOs do backend: o editor aponta nome de campo errado antes de rodar."],
  ["Material UI 9", "Componentes prontos (campos, diálogos, abas, listas) com o tema do Impulso."],
  ["React Router 8", "Rotas por perfil, com as páginas protegidas pelo RequerPerfil."],
  ["axios", "Chamadas à API num cliente só (services/api.ts)."],
  ["@fontsource", "Fontes Fredoka (títulos) e Nunito (texto) servidas junto com o site, sem pedir nada ao Google."],
  ["oxlint", "Conferência do código (npm run lint)."],
];

const pastas = [
  ["main.tsx / App.tsx", "Entrada do app: tema, fontes, roteador e a tabela de rotas por perfil."],
  ["tema.ts", "Cores, fontes, cantos arredondados e botões em pílula."],
  ["layout/", "Moldura das páginas: cabeçalho com o usuário logado e o menu do perfil."],
  ["pages/", "Uma pasta por área: login, alunos, avaliacoes, evolucao, profissionais, responsaveis, empresa, grupos, estrutura, classificacoes, familia, usuarios."],
  ["components/", "Peças reaproveitadas: diálogos de formulário e de exclusão, acesso (criar e gerenciar), gráfico de linha, linha de pessoa, busca, estado vazio."],
  ["hooks/useDados.ts", "Busca os dados ao abrir a tela e de novo quando um filtro muda; recarregar() atualiza depois de salvar."],
  ["services/", "Um service por controller do backend (ex.: alunoService), com a rota real no comentário de cada função; api.ts, erros.ts e sessao.ts."],
  ["sessao/", "SessaoProvider (quem entrou), RequerPerfil (barra quem não tem o perfil) e a página inicial de cada perfil."],
  ["types/", "Os mesmos DTOs do backend, com os mesmos nomes de campo (ex.: nmPessoa, tpUsuario)."],
  ["utils/", "Cores por área, rótulos dos enums, datas, documentos (CPF, CNPJ, telefone) e medidas."],
];

const telas = [
  ["/login", "Todos", "Entrar com e-mail e senha. Mostra a mensagem do backend (credenciais inválidas, muitas tentativas)."],
  ["/alunos", "ADMIN, PROFISSIONAL", "Lista de alunos com busca e \"Mostrar inativos\"; o profissional vê só os dele."],
  ["/alunos/novo e /alunos/:id/editar", "ADMIN, PROFISSIONAL", "Cadastro do aluno, com medidas em cm ou m e (para o ADMIN) a escolha do profissional."],
  ["/alunos/:id", "ADMIN, PROFISSIONAL", "Página do aluno com abas Dados, Responsáveis, Endereços (com CEP), Avaliações e Evolução; transferir, inativar e ativar."],
  ["/avaliacoes/nova", "ADMIN, PROFISSIONAL", "Escolhe a criança e a data, \"Iniciar avaliação\" traz a ficha do grupo da idade e grava as respostas e as medidas."],
  ["/alunos/:id/avaliacoes/:id", "ADMIN, PROFISSIONAL", "Detalhe da avaliação: resultados com unidade e classificação, IMC e RCE; corrigir e excluir."],
  ["/responsaveis", "ADMIN, PROFISSIONAL", "Responsáveis com busca; criar acesso; o ADMIN gerencia o acesso (e-mail, senha, bloqueio)."],
  ["/profissionais", "ADMIN", "Cadastro de profissionais e do acesso de cada um."],
  ["/grupos e /grupos/:id", "ADMIN", "Estrutura da ficha: grupos por faixa etária, subgrupos e perguntas."],
  ["/classificacoes", "ADMIN", "Faixas de classificação de testes, IMC e RCE, por sexo e idade."],
  ["/empresa", "ADMIN", "Dados da empresa (razão social e CNPJ)."],
  ["/usuarios", "ADMIN", "Todos os acessos com filtro por perfil e busca; novo administrador; o próprio acesso não tem botão de bloquear."],
  ["/familia e /familia/:id", "RESPONSAVEL", "Só leitura, pensada para celular: os filhos, a evolução e as avaliações."],
];

const erros = [
  ["400 com \"campos\"", "Validação do backend", "As mensagens de cada campo aparecem juntas no diálogo ou no formulário."],
  ["400, 403, 404, 409, 429", "Regra de negócio", "A mensagem do campo \"erro\" vem igual do backend (ex.: \"A faixa etária se sobrepõe a outro grupo!\")."],
  ["401 fora do login", "Token vencido, acesso bloqueado ou senha trocada", "A sessão é apagada e o app volta ao login."],
  ["Sem resposta ou 5xx", "Backend fora do ar", "\"O servidor não responde. Confira se o backend está rodando e tente novamente!\""],
];

const visual = [
  ["Lavanda #7C5CD6", "Cor principal (botões, item ativo do menu)."],
  ["Amarelo #FFD166", "Destaque (avisos, selo \"Você\")."],
  ["Fundo #F7F3FF / texto #2E2650", "Base clara com texto escuro e contraste confortável."],
  ["Um pastel por área", "Alunos pêssego, Estrutura lavanda, Classificações amarelo, Profissionais menta, Empresa azul, Responsáveis rosa, Usuários água."],
  ["Fredoka e Nunito", "Títulos arredondados e texto fácil de ler, servidos com o site."],
];

const decisoes = [
  "TypeScript em vez de JavaScript: os tipos espelham os DTOs e o editor acusa campo com nome errado.",
  "Material UI como biblioteca visual, com um tema próprio no lugar do visual padrão (que tinha cara de sistema bruto).",
  "Telas do ADMIN primeiro, depois as do profissional e do responsável.",
  "Primeiro todas as telas com dados de exemplo, num service por controller; depois cada service trocou o corpo pela rota real (T7), sem mexer nas telas.",
  "Frontend na pasta frontend do mesmo repositório. No desenvolvimento, o proxy do Vite manda /api para o backend, então não há CORS.",
  "Nomes em português e iguais aos do backend; enums como uniões de texto (o tsconfig usa erasableSyntaxOnly).",
  "Sessão guardada no navegador (token, perfil e e-mail). O backend confere o token a cada pedido, então bloquear um acesso tira a pessoa na hora.",
];

const comandos = [
  "cd frontend",
  "npm install            (no PowerShell, se o npm for bloqueado: npm.cmd install)",
  "npm run dev            → http://localhost:5173  (o backend precisa estar na 8080)",
  "npm run build          → confere os tipos e gera a pasta dist",
  "npm run lint           → oxlint",
];

const tarefas = [
  ["T1", "Projeto (Vite + React + TypeScript), proxy /api e tema", "Concluída"],
  ["T2", "Tema e moldura (cabeçalho, menu por perfil)", "Concluída"],
  ["T3", "Login e sessão (SessaoProvider, RequerPerfil)", "Concluída"],
  ["T4–T6", "Telas do ADMIN: grupos, estrutura da ficha e classificações", "Concluída"],
  ["—", "Telas do profissional, do responsável e o restante do ADMIN, com dados de exemplo", "Concluída"],
  ["T7", "Ligar cada service à API (feita à mão pelo Victor, conferida com 110 chamadas)", "Concluída"],
  ["—", "Aba Usuários e cadastro de administradores", "Concluída"],
  ["—", "Limpeza dos dados de exemplo e fontes servidas com o site", "Concluída"],
];

const dotArquitetura = `digraph Front {
  rankdir=LR; graph [fontname="Helvetica", nodesep=0.45, ranksep=0.6];
  node [fontname="Helvetica", fontsize=11, shape=box, style="filled,rounded", fontcolor="white"];
  edge [fontname="Helvetica", fontsize=9, color="#555555"];
  P [label="Telas (pages)\\ne componentes", fillcolor="#7C5CD6"];
  H [label="useDados\\n(carregar, recarregar)", fillcolor="#513C8B"];
  S [label="services\\n(um por controller)", fillcolor="#2E75B6"];
  A [label="api.ts (axios)\\ntoken no pedido,\\nErroApi na resposta", fillcolor="#1F3864"];
  SE [label="SessaoProvider\\nRequerPerfil", fillcolor="#833C0C"];
  B [label="Backend\\n/api (8080)", fillcolor="#548235"];
  P -> H -> S -> A; A -> B [label=" proxy do Vite\\n /api "];
  SE -> P [style=dashed, label=" quem pode ver "];
  A -> SE [style=dashed, label=" 401: volta ao login "];
}`;

const dotNavegacao = `digraph Nav {
  rankdir=TB; graph [fontname="Helvetica", nodesep=0.3, ranksep=0.5];
  node [fontname="Helvetica", fontsize=10, shape=box, style="filled,rounded", fontcolor="white"];
  edge [color="#777777", arrowsize=0.6];
  L [label="Login", fillcolor="#7C5CD6"];
  subgraph cluster_admin { label="ADMIN"; fontname="Helvetica"; fontsize=11; color="#999999"; style=dashed;
    A1 [label="Alunos", fillcolor="#2E75B6"]; A2 [label="Nova avaliação", fillcolor="#2E75B6"]; A3 [label="Responsáveis", fillcolor="#2E75B6"];
    A4 [label="Profissionais", fillcolor="#1F3864"]; A5 [label="Estrutura da ficha", fillcolor="#1F3864"]; A6 [label="Classificações", fillcolor="#1F3864"];
    A7 [label="Empresa", fillcolor="#1F3864"]; A8 [label="Usuários", fillcolor="#1F3864"]; }
  subgraph cluster_prof { label="PROFISSIONAL"; fontname="Helvetica"; fontsize=11; color="#999999"; style=dashed;
    P1 [label="Meus alunos", fillcolor="#2E75B6"]; P2 [label="Nova avaliação", fillcolor="#2E75B6"]; P3 [label="Responsáveis", fillcolor="#2E75B6"]; }
  subgraph cluster_resp { label="RESPONSÁVEL"; fontname="Helvetica"; fontsize=11; color="#999999"; style=dashed;
    R1 [label="Minhas crianças\\n(evolução e avaliações)", fillcolor="#548235"]; }
  L -> A1; L -> P1; L -> R1;
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
      children: linhas.map((l) => new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: l || " ", font: "Consolas", size: 17 })] })),
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
  const p = (t) => new Paragraph({ children: [new TextRun(t)], spacing: { after: 120 } });
  const item = (t) => new Paragraph({ text: t, bullet: { level: 0 }, spacing: { after: 60 } });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "Impulso", bold: true, size: 44, color: HEADER_BG })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "Especificação Detalhada — Fase 4: Frontend", size: 30 })] }),
        p("A Fase 4 entrega a interface web do Impulso. Todas as telas dos três perfis (ADMIN, profissional e responsável) existem e falam com o backend. As telas foram feitas primeiro com dados de exemplo e depois ligadas à API, service por service. A fase está concluída: a conferência final chamou cada função de cada service contra uma cópia do backend com o banco zerado, nos três perfis (110 chamadas), e abriu as telas no navegador."),

        h1("1. Blocos da Fase"),
        tabela(["Bloco", "Entrega", "O que muda para o usuário", "Requisito"], [700, 2100, 5500, 1200], blocos),

        h1("2. Tecnologias"),
        tabela(["Peça", "Para que serve"], [2400, 7100], stack),

        h1("3. Como o Frontend se Organiza"),
        await imagem(viz, dotArquitetura, 620),
        p("Cada tela pede os dados pelo hook useDados, que chama a função do service. O service só monta a chamada (método, rota, parâmetros e corpo) e entrega ao api.ts, que põe o token da sessão no cabeçalho e transforma qualquer erro num ErroApi com o status, a mensagem e os campos que o backend mandou. Assim as telas não conhecem URL nem formato de erro."),
        tabela(["Pasta ou arquivo", "O que tem"], [2400, 7100], pastas),

        h1("4. Telas por Perfil"),
        await imagem(viz, dotNavegacao, 600),
        tabela(["Rota", "Perfil", "O que a tela faz"], [2700, 1900, 4900], telas, { monoCols: [0], tamanho: 19 }),
        p("O menu mostra só o que o perfil pode usar, e cada grupo de rotas fica dentro de um RequerPerfil. Quem abre uma rota de outro perfil, ou um endereço que não existe, vai para a página inicial do próprio perfil. O responsável não tem menu: a área da família é feita para o celular."),

        h1("5. Sessão e Erros"),
        p("Ao entrar, o app guarda no navegador o token, o perfil e o e-mail (chave impulso.sessao), para sobreviver ao F5. Todo pedido leva o token no cabeçalho Authorization. Como o backend confere o token a cada pedido, um acesso bloqueado ou com a senha trocada recebe 401 no pedido seguinte, e o app apaga a sessão e volta ao login."),
        tabela(["Resposta", "Quando", "O que a tela mostra"], [2100, 2800, 4600], erros),

        h1("6. Visual"),
        p("O público são professores de crianças, então o visual evita a cara de sistema administrativo: cores em tons bebê, cantos arredondados, botões em pílula e um pastel diferente para cada área do menu."),
        tabela(["Elemento", "Uso"], [2800, 6700], visual),

        h1("7. Decisões"),
        ...decisoes.map(item),

        h1("8. Como Rodar"),
        blocoCodigo(comandos),
        p("No desenvolvimento, o Vite atende na 5173 e repassa tudo o que começa com /api para o backend na 8080. Por isso o frontend e a API parecem estar no mesmo endereço e o navegador não precisa de CORS."),

        h1("9. Tarefas da Fase 4"),
        tabela(["#", "Tarefa", "Status"], [800, 7200, 1500], tarefas),
      ],
    }],
  });

  fs.writeFileSync(SAIDA, await Packer.toBuffer(doc));
  console.log("OK: " + SAIDA);
}

main().catch((e) => { console.error(e); process.exit(1); });
