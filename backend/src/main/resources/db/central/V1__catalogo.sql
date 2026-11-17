-- ============================================================
-- Impulso — Banco central (PostgreSQL)
-- ============================================================
-- Fica fora dos bancos dos clientes. Guarda só duas coisas: quem são os clientes
-- (cada escola ou academia, com o banco dela) e de qual cliente é cada e-mail de login.
-- Os dados das crianças, avaliações e acessos ficam no banco de cada cliente.

CREATE TABLE cliente (
    id          BIGSERIAL PRIMARY KEY,
    cd_cliente  VARCHAR(30)  NOT NULL UNIQUE,   -- código curto, ex.: escola-abc
    nm_cliente  VARCHAR(150) NOT NULL,
    nm_banco    VARCHAR(63)  NOT NULL UNIQUE,   -- nome do banco PostgreSQL do cliente
    st_ativo    BOOLEAN      NOT NULL DEFAULT TRUE,
    dt_criacao  TIMESTAMP    NOT NULL DEFAULT now()
);

-- O e-mail de login é único no sistema inteiro: é por ele que o login descobre o cliente.
-- Guardado em minúsculas, igual à tabela usuario de cada cliente.
CREATE TABLE login (
    email       VARCHAR(150) PRIMARY KEY,
    cliente_id  BIGINT       NOT NULL REFERENCES cliente(id)
);

CREATE INDEX idx_login_cliente ON login(cliente_id);
