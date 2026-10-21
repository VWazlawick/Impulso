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
    tp_sexo          VARCHAR(10)  NOT NULL
        CHECK (tp_sexo IN ('MASCULINO', 'FEMININO')),
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

-- Avaliação (Fase 2)
-- Estrutura da ficha, cadastrável pelo ADMIN: grupo (faixa etária) > subgrupo > pergunta.
-- O conteúdo fica só no banco da instância, nunca no código (pode ser licenciado).

-- A idade do aluno (anos completos na data da avaliação) escolhe o grupo.
-- As faixas dos grupos não podem se sobrepor (validado na aplicação).
CREATE TABLE grupo (
    id            BIGSERIAL PRIMARY KEY,
    nm_grupo      VARCHAR(50)  NOT NULL,
    nr_idade_min  INT          NOT NULL,
    nr_idade_max  INT          NOT NULL,
    CHECK (nr_idade_min >= 0 AND nr_idade_min <= nr_idade_max)
);

-- tp_calculo define o resultado do subgrupo: nenhum, melhor tentativa (maior ou menor valor)
-- ou estágio (Inicial/Elementar/Maduro pela contagem de NÃO e PARCIAL).
CREATE TABLE subgrupo (
    id           BIGSERIAL PRIMARY KEY,
    nm_subgrupo  VARCHAR(100) NOT NULL,
    tp_calculo   VARCHAR(20)  NOT NULL
        CHECK (tp_calculo IN ('NENHUM', 'MAIOR_VALOR', 'MENOR_VALOR', 'ESTAGIO')),
    nr_ordem     INT          NOT NULL,
    grupo_id     BIGINT NOT NULL REFERENCES grupo(id)
);

CREATE TABLE pergunta (
    id           BIGSERIAL PRIMARY KEY,
    ds_pergunta  VARCHAR(255) NOT NULL,
    tp_resposta  VARCHAR(20)  NOT NULL
        CHECK (tp_resposta IN ('NUMERO', 'SIM_NAO_PARCIAL')),
    ds_unidade   VARCHAR(20),
    nr_ordem     INT          NOT NULL,
    subgrupo_id  BIGINT NOT NULL REFERENCES subgrupo(id)
);

-- O profissional gravado é o responsável pelo aluno na data da avaliação.
CREATE TABLE avaliacao (
    id               BIGSERIAL PRIMARY KEY,
    dt_avaliacao     DATE   NOT NULL,
    aluno_id         BIGINT NOT NULL REFERENCES aluno(id),
    profissional_id  BIGINT NOT NULL REFERENCES profissional(id),
    grupo_id         BIGINT NOT NULL REFERENCES grupo(id)
);

-- Uma resposta por pergunta: vl_resposta para NUMERO, tp_opcao para SIM_NAO_PARCIAL.
CREATE TABLE resposta (
    id            BIGSERIAL PRIMARY KEY,
    vl_resposta   NUMERIC(8,2),
    tp_opcao      VARCHAR(10)
        CHECK (tp_opcao IN ('SIM', 'NAO', 'PARCIAL')),
    avaliacao_id  BIGINT NOT NULL REFERENCES avaliacao(id),
    pergunta_id   BIGINT NOT NULL REFERENCES pergunta(id),
    UNIQUE (avaliacao_id, pergunta_id)
);

-- Resultado de cada subgrupo, calculado e gravado ao salvar (e recalculado ao editar).
CREATE TABLE avaliacao_resumo (
    id            BIGSERIAL PRIMARY KEY,
    vl_resultado  NUMERIC(8,2),
    tp_estagio    VARCHAR(10)
        CHECK (tp_estagio IN ('INICIAL', 'ELEMENTAR', 'MADURO')),
    avaliacao_id  BIGINT NOT NULL REFERENCES avaliacao(id),
    subgrupo_id   BIGINT NOT NULL REFERENCES subgrupo(id),
    UNIQUE (avaliacao_id, subgrupo_id)
);

-- Índices de apoio às consultas mais comuns
CREATE INDEX idx_aluno_profissional ON aluno(profissional_id);
CREATE INDEX idx_endereco_aluno ON endereco(aluno_id);
CREATE INDEX idx_subgrupo_grupo ON subgrupo(grupo_id);
CREATE INDEX idx_pergunta_subgrupo ON pergunta(subgrupo_id);
CREATE INDEX idx_avaliacao_aluno ON avaliacao(aluno_id);
-- resposta e avaliacao_resumo já ganham índice por avaliacao_id pelos UNIQUE (avaliacao_id, ...).
