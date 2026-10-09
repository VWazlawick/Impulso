-- ============================================================
-- Impulso — Script DDL (PostgreSQL)
-- ============================================================

-- Documentos (CPF, CNPJ, CEP) e siglas são gravados só com dígitos/letras, sem formatação.

-- Geografia (dados de referência, somente leitura para os demais perfis)
CREATE TABLE pais (
    id       BIGSERIAL PRIMARY KEY,
    nm_pais  VARCHAR(100) NOT NULL,
    sg_pais  VARCHAR(2)   NOT NULL UNIQUE
);

CREATE TABLE estado (
    id         BIGSERIAL PRIMARY KEY,
    nm_estado  VARCHAR(100) NOT NULL,
    sg_estado  VARCHAR(2)   NOT NULL UNIQUE,
    pais_id    BIGINT       NOT NULL REFERENCES pais(id)
);

-- cd_ibge: código do município no IBGE, usado para casar o resultado da busca por CEP (ViaCEP).
CREATE TABLE cidade (
    id         BIGSERIAL PRIMARY KEY,
    nm_cidade  VARCHAR(150) NOT NULL,
    cd_ibge    BIGINT       NOT NULL UNIQUE,
    estado_id  BIGINT       NOT NULL REFERENCES estado(id)
);

-- Pessoas e acesso
CREATE TABLE usuario (
    id         BIGSERIAL PRIMARY KEY,
    email      VARCHAR(150) NOT NULL UNIQUE,
    sn_usuario VARCHAR(255) NOT NULL,
    tp_usuario VARCHAR(20)  NOT NULL
        CHECK (tp_usuario IN ('ADMIN', 'PROFISSIONAL', 'RESPONSAVEL')),
    st_ativo   BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE empresa (
    id            BIGSERIAL PRIMARY KEY,
    razao_social  VARCHAR(150) NOT NULL,
    cnpj          VARCHAR(14)  NOT NULL UNIQUE
);

-- Pessoa: dados comuns de profissional, responsável e aluno (herança JPA JOINED).
-- O id das tabelas filhas é o mesmo id da pessoa. CPF é opcional aqui porque aluno e
-- responsável podem não ter; a obrigatoriedade para profissional é validada na aplicação.
CREATE TABLE pessoa (
    id         BIGSERIAL PRIMARY KEY,
    nm_pessoa  VARCHAR(150) NOT NULL,
    cpf        VARCHAR(11)  UNIQUE,
    email      VARCHAR(150)
);

-- usuario_id é opcional: a pessoa é cadastrada primeiro e o acesso ao sistema é criado depois.
CREATE TABLE profissional (
    id          BIGINT PRIMARY KEY REFERENCES pessoa(id),
    usuario_id  BIGINT UNIQUE REFERENCES usuario(id),
    empresa_id  BIGINT NOT NULL REFERENCES empresa(id)
);

-- Responsável é um cadastro enxuto: nome (em pessoa) e um telefone.
CREATE TABLE responsavel (
    id             BIGINT PRIMARY KEY REFERENCES pessoa(id),
    nr_telefone    VARCHAR(11)  NOT NULL,
    usuario_id     BIGINT UNIQUE REFERENCES usuario(id)
);

CREATE TABLE aluno (
    id               BIGINT PRIMARY KEY REFERENCES pessoa(id),
    dt_nascimento    DATE NOT NULL,
    tp_servico       VARCHAR(20)  NOT NULL
        CHECK (tp_servico IN ('UMA_VEZ_SEMANA', 'DUAS_VEZES_SEMANA', 'DIARIA')),
    profissional_id  BIGINT NOT NULL REFERENCES profissional(id)
);

-- Endereços pertencem ao aluno (um ou mais, ex.: pais separados).
CREATE TABLE endereco (
    id            BIGSERIAL PRIMARY KEY,
    rua           VARCHAR(150) NOT NULL,
    nr_casa       VARCHAR(20)  NOT NULL,
    bairro        VARCHAR(100) NOT NULL,
    cep           VARCHAR(8)   NOT NULL,
    complemento   VARCHAR(100),
    cidade_id     BIGINT NOT NULL REFERENCES cidade(id),
    aluno_id      BIGINT NOT NULL REFERENCES aluno(id)
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

CREATE TABLE pergunta (
    id               BIGSERIAL PRIMARY KEY,
    enunciado        VARCHAR(255) NOT NULL,
    tipo             VARCHAR(20)  NOT NULL
        CHECK (tipo IN ('MULTIPLA_ESCOLHA', 'VERDADEIRO_FALSO', 'ESCALA', 'TEXTO_LIVRE', 'MEDIDA_NUMERICA')),
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
CREATE INDEX idx_endereco_aluno ON endereco(aluno_id);
CREATE INDEX idx_avaliacao_aluno ON avaliacao(aluno_id);
CREATE INDEX idx_resposta_avaliacao ON resposta(avaliacao_id);
CREATE INDEX idx_avaliacao_resumo_avaliacao ON avaliacao_resumo(avaliacao_id);
CREATE INDEX idx_pergunta_questionario ON pergunta(questionario_id);
