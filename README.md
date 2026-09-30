# Impulso

Sistema de controle de avaliações físico-motoras para um programa infantil de avaliação física/motora. Projeto pessoal/portfólio, desenvolvido em fases curtas (~1h/dia).

## Stack

- **Backend:** Java 17+, Spring Boot 3.x (Spring Web, Spring Data JPA, Spring Security)
- **Frontend:** React (aplicação separada, consumindo a API REST)
- **Banco de dados:** PostgreSQL
- **Autenticação:** JWT
- **Build:** Maven

## Modelo de negócio

Base reaproveitável: cada empresa cliente roda sua própria instância (não é multi-tenant com dados compartilhados). Perfis de usuário: **Profissional** (cadastra alunos, questionários e avaliações), **Responsável** (visualiza avaliações e evolução dos alunos vinculados) e **Admin** (altera dados de qualquer usuário).

## Documentação

Os documentos completos de planejamento estão em [`docs/`](docs):

- [`Levantamento_de_Requisitos.docx`](docs/Levantamento_de_Requisitos.docx) — requisitos funcionais, não funcionais e complementares (RF/RNF/RC).
- [`Documentacao_Planejamento.docx`](docs/Documentacao_Planejamento.docx) — escopo, arquitetura, backlog por fase, setup e roadmap.
- [`Plano_de_Classes.docx`](docs/Plano_de_Classes.docx) — diagrama de classes de domínio e organização em camadas (controller/service/repository/model/security).
- [`Planejamento_Banco_de_Dados.docx`](docs/Planejamento_Banco_de_Dados.docx) — diagrama ER e script DDL (PostgreSQL).

## Escopo do MVP

- Cadastro de alunos, profissionais e usuários.
- Avaliações estruturadas por faixa etária: Dimensão Corporal, Aptidão Física e Aptidão Motora.
- Cálculo e armazenamento do score por categoria/habilidade a cada avaliação.
- Relatório de evolução do aluno.
- Autenticação JWT com controle de acesso por perfil.

Fora do MVP (fase futura): Aula/Horário com notificação, Contrato do aluno, versão mobile.

## Setup local

1. Java 17+, Maven, Node.js e PostgreSQL instalados.
2. Criar o banco e rodar o DDL de `Planejamento_Banco_de_Dados.docx`.
3. Configurar as credenciais do banco no backend e rodar com `mvn spring-boot:run`.
4. Rodar o frontend com `npm install` e `npm start`.
