# Impulso

Sistema de controle de avaliações físico-motoras para um programa infantil de avaliação física/motora. Projeto pessoal/portfólio, desenvolvido em fases curtas (~1h/dia).

## Situação

| Fase | Entrega | Situação |
|---|---|---|
| 1 | Cadastros: login JWT, profissionais, alunos, responsáveis, acessos, geografia (IBGE), endereços com busca de CEP (ViaCEP) | ✅ Concluída |
| 2 | Módulo de avaliação: ficha cadastrável por faixa etária, registro, cálculo dos resultados, consulta e correção | ✅ Concluída |
| 3 | Acesso do responsável, medidas com IMC/RCE, relatório de evolução e classificação por idade e sexo | ✅ Concluída |
| 4 | Frontend React (TypeScript + Material UI) com as telas dos três perfis e a aba Usuários | ✅ Concluída |
| 5 | Segurança (bloqueio na hora, limite de tentativas, perfil de produção) e vários clientes: um backend, um banco por escola | ✅ Concluída |
| 6 | No ar sem custo (Render + Neon), ficha por planilha, escola modelo para escolas novas, local e duração da avaliação | ✅ Concluída |
| 7 | Domínio próprio, backup, hospedagem no Brasil, Aula/Contrato/Mobile e LGPD dentro do sistema | 🔜 Futura |

## Stack

- **Backend:** Java 17, Spring Boot 4 (Spring Web MVC, Spring Data JPA, Spring Security com OAuth2 Resource Server), Lombok, Bean Validation
- **Banco de dados:** PostgreSQL, com a estrutura versionada pelo Flyway (um banco central e um banco por escola)
- **Autenticação:** JWT (HS256), com perfis ADMIN, PROFISSIONAL e RESPONSAVEL
- **Documentação da API:** Swagger / OpenAPI (springdoc), desligado no perfil de produção
- **Integrações:** API do IBGE (países, estados e cidades) e ViaCEP (busca de CEP)
- **Frontend:** React 19, TypeScript, Material UI, Vite
- **Planilhas:** Apache POI (importação da ficha)
- **Build:** Maven e npm, num Dockerfile só (o backend serve o site)
- **Hospedagem:** Render (Docker) e Neon (PostgreSQL), no plano gratuito, os dois em Virgínia (EUA)

## Como funciona

- O **ADMIN** monta a ficha de avaliação: **grupos** por faixa etária, **subgrupos** (um teste ou uma habilidade, cada um com um tipo de cálculo) e **perguntas** (numéricas com unidade, ou critérios marcados como SIM, NÃO ou PARCIAL).
- O **profissional** escolhe o aluno; a idade na data da avaliação escolhe o grupo, e o sistema devolve a ficha em branco.
- Ao salvar, o sistema calcula o resultado de cada subgrupo: a **melhor tentativa** (maior ou menor valor) ou o **estágio motor** (Inicial, Elementar ou Maduro). A avaliação pode ser corrigida, e os resultados são recalculados.
- Peso, estatura e cintura ficam no cadastro do aluno e em cada avaliação, e a avaliação calcula o **IMC** e a **RCE**. A ficha vem preenchida com as medidas do cadastro, e a avaliação mais recente as atualiza.
- O ADMIN cadastra as **faixas de classificação** por idade e sexo ("a partir de tal valor, a classificação é tal"), e os resultados, o IMC e a RCE passam a vir classificados.
- O **relatório de evolução** mostra a linha do tempo das avaliações e uma série por teste, mesmo quando o aluno muda de faixa etária.
- Cada profissional só enxerga os próprios alunos (e os responsáveis, endereços e avaliações deles); o **responsável** vê, só para leitura, os dados, as avaliações e a evolução dos filhos; o ADMIN enxerga tudo.
- **Várias escolas** usam o mesmo sistema e o mesmo endereço: cada uma tem o próprio banco, e o **e-mail de login** diz de qual escola é a pessoa.
- A ficha inteira (grupos, testes, perguntas e tabelas de referência) pode vir de uma **planilha**, conferida antes de gravar, e uma **escola nova** já nasce com a ficha da escola modelo.
- A avaliação também guarda, se quiser, o **local** e a **duração** da sessão.

O conteúdo das fichas reais e as tabelas de classificação podem ser licenciados, então são cadastrados no banco de cada escola (pelas telas ou pela planilha da própria escola) e **não fazem parte deste repositório**.

## Documentação

Os documentos de planejamento estão em [`docs/`](docs) (gerados pelos scripts de [`docs/gerador`](docs/gerador)):

- [`Levantamento_de_Requisitos.docx`](docs/Levantamento_de_Requisitos.docx) — requisitos funcionais, não funcionais e complementares (RF/RNF/RC), com a situação de cada um.
- [`Documentacao_Planejamento.docx`](docs/Documentacao_Planejamento.docx) — escopo, arquitetura, backlog por fase, setup e roadmap.
- [`Plano_de_Classes.docx`](docs/Plano_de_Classes.docx) — diagramas de classes (cadastros, avaliação e classificação) e organização em pacotes.
- [`Planejamento_Banco_de_Dados.docx`](docs/Planejamento_Banco_de_Dados.docx) — diagrama ER, script DDL do banco de cada escola, banco central e Flyway.
- [`Especificacao_Detalhada_Fase1.docx`](docs/Especificacao_Detalhada_Fase1.docx) a [`Especificacao_Detalhada_Fase3.docx`](docs/Especificacao_Detalhada_Fase3.docx) — entidades, permissões, contrato da API, erros e critérios de aceite do backend.
- [`Especificacao_Detalhada_Fase4.docx`](docs/Especificacao_Detalhada_Fase4.docx) — frontend: organização, telas por perfil, sessão, erros, visual e como rodar.
- [`Especificacao_Detalhada_Fase5.docx`](docs/Especificacao_Detalhada_Fase5.docx) — segurança, vários clientes (Modelo 2), Flyway e comandos de administração.
- [`Especificacao_Detalhada_Fase6.docx`](docs/Especificacao_Detalhada_Fase6.docx) — hospedagem (Render + Neon), ficha por planilha, escola modelo e local e duração da avaliação.

## Setup local

1. Instalar Java 17+, PostgreSQL e Node.js (o projeto traz o Maven Wrapper, `mvnw`).
2. Criar no PostgreSQL o banco central `impulso_central`, vazio. As tabelas são criadas pelo Flyway quando o backend sobe.
3. Definir as variáveis de ambiente:
   - `DB_PASSWORD` — senha do usuário `postgres`;
   - `JWT_SECRET` — chave de assinatura do token.
4. Cadastrar a primeira escola rodando o backend com os argumentos abaixo (no IntelliJ, em **Program arguments** de uma cópia da run config). O comando cria o banco da escola, importa a geografia do IBGE (precisa de internet), cria a empresa e o primeiro admin, e mostra uma senha provisória:

   ```
   --novo-cliente --codigo=escola-abc --nome="Escola ABC" --cnpj=11222333000181 --admin-email=admin@escola-abc.com.br
   ```

5. Rodar o backend (pasta `backend`) com `mvnw spring-boot:run` (`mvnw.cmd` no Windows) ou pelo IntelliJ, e testar pelo Swagger em `http://localhost:8080/swagger-ui.html`.
6. Rodar o frontend (pasta `frontend`) com `npm install` e `npm run dev` (no PowerShell, `npm.cmd`), e abrir `http://localhost:5173`.

Esqueceu a senha de um acesso? Rode o backend com `--redefinir-senha --email=...` para gerar uma senha provisória nova.

Montar a ficha de uma escola sem estrutura a partir da planilha (o modelo `estrutura-avaliacao.xlsx` traz instruções e exemplos; a planilha preenchida fica fora do repositório):

```
--importar-estrutura --codigo=escola-abc --arquivo="C:\caminho\estrutura-avaliacao.xlsx"
```

Uma escola nova já nasce com a ficha da escola modelo (`app.clientes.modelo`); use `--modelo=código` para outra escola ou `--sem-modelo` para a ficha vazia.

## No ar

- O `Dockerfile` da raiz monta o frontend e o backend num jar só. No Render, é um Web Service Docker com três variáveis: `SPRING_PROFILES_ACTIVE=prod`, `DATABASE_URL` (string direta do Neon, sem `-pooler`) e `JWT_SECRET`. Cada push na `main` gera uma versão nova.
- No computador, o `neon link` grava a conexão do Neon no `.env.local` (fora do Git). Uma run config com `neon` em **Active profiles** faz os comandos acima agirem no banco do site; sem o perfil, eles agem no PostgreSQL do computador.
- No plano gratuito, o serviço dorme depois de 15 minutos sem acesso, e o primeiro acesso depois disso leva cerca de 1 minuto.
