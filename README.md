# Impulso

Sistema de controle de avaliações físico-motoras para um programa infantil de avaliação física/motora. Projeto pessoal/portfólio, desenvolvido em fases curtas (~1h/dia).

## Situação

| Fase | Entrega | Situação |
|---|---|---|
| 1 | Cadastros: login JWT, profissionais, alunos, responsáveis, acessos, geografia (IBGE), endereços com busca de CEP (ViaCEP) | ✅ Concluída |
| 2 | Módulo de avaliação: ficha cadastrável por faixa etária, registro, cálculo dos resultados, consulta e correção | ✅ Concluída |
| 3 | Acesso do responsável, medidas com IMC/RCE, relatório de evolução e classificação por idade e sexo | ✅ Concluída |
| 4 | Frontend React | ⏳ Próxima |

O backend cobre o escopo do MVP; fica pendente apenas inativar aluno.

## Stack

- **Backend:** Java 17, Spring Boot 4 (Spring Web MVC, Spring Data JPA, Spring Security com OAuth2 Resource Server), Lombok, Bean Validation
- **Banco de dados:** PostgreSQL
- **Autenticação:** JWT (HS256), com perfis ADMIN, PROFISSIONAL e RESPONSAVEL
- **Documentação da API:** Swagger / OpenAPI (springdoc)
- **Integrações:** API do IBGE (carga inicial de países, estados e cidades) e ViaCEP (busca de CEP)
- **Frontend:** React (Fase 4)
- **Build:** Maven

## Como funciona

- O **ADMIN** monta a ficha de avaliação: **grupos** por faixa etária, **subgrupos** (um teste ou uma habilidade, cada um com um tipo de cálculo) e **perguntas** (numéricas com unidade, ou critérios marcados como SIM, NÃO ou PARCIAL).
- O **profissional** escolhe o aluno; a idade na data da avaliação escolhe o grupo, e o sistema devolve a ficha em branco.
- Ao salvar, o sistema calcula o resultado de cada subgrupo: a **melhor tentativa** (maior ou menor valor) ou o **estágio motor** (Inicial, Elementar ou Maduro). A avaliação pode ser corrigida, e os resultados são recalculados.
- Peso, estatura e cintura ficam no cadastro do aluno e em cada avaliação, e a avaliação calcula o **IMC** e a **RCE**. A ficha vem preenchida com as medidas do cadastro, e a avaliação mais recente as atualiza.
- O ADMIN cadastra as **faixas de classificação** por idade e sexo ("a partir de tal valor, a classificação é tal"), e os resultados, o IMC e a RCE passam a vir classificados.
- O **relatório de evolução** mostra a linha do tempo das avaliações e uma série por teste, mesmo quando o aluno muda de faixa etária.
- Cada profissional só enxerga os próprios alunos (e os responsáveis, endereços e avaliações deles); o **responsável** vê, só para leitura, os dados, as avaliações e a evolução dos filhos; o ADMIN enxerga tudo.

O conteúdo das fichas reais e as tabelas de classificação podem ser licenciados, então são cadastrados em cada instância e **não fazem parte deste repositório**.

## Documentação

Os documentos de planejamento estão em [`docs/`](docs) (gerados pelos scripts de [`docs/gerador`](docs/gerador)):

- [`Levantamento_de_Requisitos.docx`](docs/Levantamento_de_Requisitos.docx) — requisitos funcionais, não funcionais e complementares (RF/RNF/RC), com a situação de cada um.
- [`Documentacao_Planejamento.docx`](docs/Documentacao_Planejamento.docx) — escopo, arquitetura, backlog por fase, setup e roadmap.
- [`Plano_de_Classes.docx`](docs/Plano_de_Classes.docx) — diagramas de classes (cadastros, avaliação e classificação) e organização em pacotes.
- [`Planejamento_Banco_de_Dados.docx`](docs/Planejamento_Banco_de_Dados.docx) — diagrama ER e script DDL (PostgreSQL).
- [`Especificacao_Detalhada_Fase1.docx`](docs/Especificacao_Detalhada_Fase1.docx), [`Especificacao_Detalhada_Fase2.docx`](docs/Especificacao_Detalhada_Fase2.docx) e [`Especificacao_Detalhada_Fase3.docx`](docs/Especificacao_Detalhada_Fase3.docx) — entidades, permissões, contrato da API, erros e critérios de aceite de cada fase.

## Setup local

1. Instalar Java 17+ e PostgreSQL (o projeto traz o Maven Wrapper, `mvnw`).
2. Criar o banco `impulso` e executar [`db/schema.sql`](db/schema.sql).
3. Definir as variáveis de ambiente:
   - `DB_PASSWORD` — senha do usuário `postgres`;
   - `JWT_SECRET` — chave de assinatura do token;
   - `ADMIN_EMAIL` e `ADMIN_SENHA` — criam o primeiro administrador na inicialização.
4. Rodar o backend (pasta `backend`) com `mvnw spring-boot:run` (`mvnw.cmd` no Windows) ou pelo IntelliJ. Na primeira inicialização, a geografia é importada do IBGE (precisa de internet).
5. Testar pelo Swagger em `http://localhost:8080/swagger-ui.html`: login em `POST /api/auth/login` e o token no botão **Authorize**.
