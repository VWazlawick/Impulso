-- ============================================================
-- Impulso — Script DDL (PostgreSQL)
-- ============================================================

-- Geografia (dados de referência, somente leitura para os demais perfis)
CREATE TABLE pais (
    id     BIGSERIAL PRIMARY KEY,
    nome   VARCHAR(100) NOT NULL,
    sigla  VARCHAR(5)   NOT NULL
);

CREATE TABLE estado (
    id      BIGSERIAL PRIMARY KEY,
    nome    VARCHAR(100) NOT NULL,
    sigla   VARCHAR(5)   NOT NULL,
    pais_id BIGINT       NOT NULL REFERENCES pais(id)
);

CREATE TABLE cidade (
    id        BIGSERIAL PRIMARY KEY,
    nome      VARCHAR(150) NOT NULL,
    estado_id BIGINT       NOT NULL REFERENCES estado(id)
);

-- Pessoas e acesso
CREATE TYPE tipo_usuario_enum AS ENUM ('ADMIN', 'PROFISSIONAL', 'RESPONSAVEL');

CREATE TABLE usuario (
    id         BIGSERIAL PRIMARY KEY,
    email      VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    tipo       tipo_usuario_enum NOT NULL
);

CREATE TABLE empresa (
    id            BIGSERIAL PRIMARY KEY,
    razao_social  VARCHAR(150) NOT NULL,
    cnpj          VARCHAR(20)  NOT NULL UNIQUE
);

CREATE TABLE profissional (
    id          BIGSERIAL PRIMARY KEY,
    nome        VARCHAR(150) NOT NULL,
    cpf         VARCHAR(14)  NOT NULL UNIQUE,
    usuario_id  BIGINT       NOT NULL UNIQUE REFERENCES usuario(id),
    empresa_id  BIGINT       NOT NULL REFERENCES empresa(id)
);

CREATE TABLE responsavel (
    id          BIGSERIAL PRIMARY KEY,
    nome        VARCHAR(150) NOT NULL,
    cpf         VARCHAR(14)  NOT NULL UNIQUE,
    usuario_id  BIGINT       NOT NULL UNIQUE REFERENCES usuario(id)
);

-- Aluno
CREATE TYPE tipo_servico_enum AS ENUM (
    'UMA_VEZ_SEMANA', 'DUAS_VEZES_SEMANA', 'TRES_VEZES_SEMANA', 'DIARIA'
);

CREATE TABLE aluno (
    id               BIGSERIAL PRIMARY KEY,
    nome             VARCHAR(150) NOT NULL,
    cpf              VARCHAR(14),
    email            VARCHAR(150),
    data_nascimento  DATE NOT NULL,
    tp_servico       tipo_servico_enum,
    profissional_id  BIGINT NOT NULL REFERENCES profissional(id)
);

CREATE TABLE endereco (
    id            BIGSERIAL PRIMARY KEY,
    rua           VARCHAR(150) NOT NULL,
    numero        VARCHAR(20),
    bairro        VARCHAR(100),
    cep           VARCHAR(10),
    complemento   VARCHAR(100),
    tipo          VARCHAR(30),
    cidade_id     BIGINT NOT NULL REFERENCES cidade(id),
    aluno_id      BIGINT NOT NULL REFERENCES aluno(id)
);

CREATE TABLE telefone (
    id        BIGSERIAL PRIMARY KEY,
    numero    VARCHAR(20) NOT NULL,
    tipo      VARCHAR(30),
    aluno_id  BIGINT NOT NULL REFERENCES aluno(id)
);

CREATE TABLE aluno_responsavel (
    aluno_id        BIGINT NOT NULL REFERENCES aluno(id),
    responsavel_id  BIGINT NOT NULL REFERENCES responsavel(id),
    PRIMARY KEY (aluno_id, responsavel_id)
);

-- Avaliação
CREATE TABLE questionario (
    id         BIGSERIAL PRIMARY KEY,
    nome       VARCHAR(100) NOT NULL,
    idade_min  INT,
    idade_max  INT
);

CREATE TYPE tipo_pergunta_enum AS ENUM (
    'MULTIPLA_ESCOLHA', 'VERDADEIRO_FALSO', 'ESCALA', 'TEXTO_LIVRE', 'MEDIDA_NUMERICA'
);

CREATE TABLE pergunta (
    id               BIGSERIAL PRIMARY KEY,
    enunciado        VARCHAR(255) NOT NULL,
    tipo             tipo_pergunta_enum NOT NULL,
    unidade          VARCHAR(20),
    categoria        VARCHAR(100),
    indice           INT,
    questionario_id  BIGINT NOT NULL REFERENCES questionario(id)
);

CREATE TABLE opcao_pergunta (
    id          BIGSERIAL PRIMARY KEY,
    pergunta_id BIGINT NOT NULL REFERENCES pergunta(id),
    texto       VARCHAR(255) NOT NULL,
    ordem       INT
);

CREATE TABLE avaliacao (
    id               BIGSERIAL PRIMARY KEY,
    data             DATE NOT NULL,
    aluno_id         BIGINT NOT NULL REFERENCES aluno(id),
    profissional_id  BIGINT NOT NULL REFERENCES profissional(id),
    questionario_id  BIGINT NOT NULL REFERENCES questionario(id)
);

CREATE TABLE resposta (
    id            BIGSERIAL PRIMARY KEY,
    valor         VARCHAR(255),
    avaliacao_id  BIGINT NOT NULL REFERENCES avaliacao(id),
    pergunta_id   BIGINT NOT NULL REFERENCES pergunta(id)
);

CREATE TABLE avaliacao_resumo (
    id            BIGSERIAL PRIMARY KEY,
    categoria     VARCHAR(100)   NOT NULL,
    score         NUMERIC(5,2)   NOT NULL,
    avaliacao_id  BIGINT NOT NULL REFERENCES avaliacao(id)
);

-- Índices de apoio às consultas mais comuns
CREATE INDEX idx_aluno_profissional ON aluno(profissional_id);
CREATE INDEX idx_avaliacao_aluno ON avaliacao(aluno_id);
CREATE INDEX idx_resposta_avaliacao ON resposta(avaliacao_id);
CREATE INDEX idx_avaliacao_resumo_avaliacao ON avaliacao_resumo(avaliacao_id);
CREATE INDEX idx_pergunta_questionario ON pergunta(questionario_id);
