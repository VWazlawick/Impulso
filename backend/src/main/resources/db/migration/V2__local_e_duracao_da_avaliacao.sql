-- Local e duração da sessão de avaliação, como no cabeçalho das fichas de observação.
-- Os dois são opcionais: as avaliações que já existem ficam sem esses dados.
ALTER TABLE avaliacao
    ADD COLUMN ds_local    VARCHAR(100),
    ADD COLUMN nr_duracao  INT CHECK (nr_duracao > 0);   -- em minutos
