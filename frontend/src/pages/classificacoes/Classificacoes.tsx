import { useState } from 'react'
import { Alert, Box, Button, ButtonBase, Card, MenuItem, TextField, Typography } from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import Carregando from '../../components/Carregando.tsx'
import Dica from '../../components/Dica.tsx'
import DialogoExcluir from '../../components/DialogoExcluir.tsx'
import Etiqueta from '../../components/Etiqueta.tsx'
import TituloPagina from '../../components/TituloPagina.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { classificacaoService } from '../../services/classificacaoService.ts'
import { grupoService } from '../../services/grupoService.ts'
import type { ClassificacaoResponse } from '../../types/classificacao.ts'
import type { Sexo, TipoIndicador } from '../../types/enums.ts'
import { corDaPosicao } from '../../utils/cores.ts'
import { faixaEtaria, formatarNumero } from '../../utils/formatos.ts'
import { resultadoNumerico } from '../../utils/regras.ts'
import { corSexo, indicadores, rotuloIndicador, rotuloSexo } from '../../utils/rotulos.ts'
import FaixaDialog, { type FaixaInicial } from './FaixaDialog.tsx'

type Bloco = {
  chave: string
  tpSexo: Sexo
  nrIdadeMin: number
  nrIdadeMax: number
  faixas: ClassificacaoResponse[]
}

type Dialogo =
  | { tipo: 'faixa'; faixa?: ClassificacaoResponse; inicial?: FaixaInicial }
  | { tipo: 'excluir'; faixa: ClassificacaoResponse }

// Junta as faixas do mesmo sexo e das mesmas idades num bloco só.
function agrupar(faixas: ClassificacaoResponse[]) {
  const blocos = new Map<string, Bloco>()
  for (const faixa of faixas) {
    const chave = `${faixa.tpSexo}|${faixa.nrIdadeMin}|${faixa.nrIdadeMax}`
    let bloco = blocos.get(chave)
    if (!bloco) {
      bloco = { chave, tpSexo: faixa.tpSexo, nrIdadeMin: faixa.nrIdadeMin, nrIdadeMax: faixa.nrIdadeMax, faixas: [] }
      blocos.set(chave, bloco)
    }
    bloco.faixas.push(faixa)
  }
  return [...blocos.values()]
}

function Classificacoes() {
  const [indicador, setIndicador] = useState<TipoIndicador>('SUBGRUPO')
  const [grupoEscolhido, setGrupoEscolhido] = useState<number | null>(null)
  const [testeEscolhido, setTesteEscolhido] = useState<number | null>(null)
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)
  const porTeste = indicador === 'SUBGRUPO'

  // Grupo e teste: o escolhido ou, enquanto ninguém escolheu, o primeiro da lista.
  const grupos = useDados(() => grupoService.listar(), [])
  const grupoId = grupoEscolhido ?? grupos.dados?.[0]?.id ?? null

  const grupo = useDados(async () => (grupoId === null ? null : grupoService.buscarPorId(grupoId)), [grupoId])
  const testes = grupo.dados ? grupo.dados.subgrupos.filter((s) => resultadoNumerico(s.tpCalculo)) : []
  const teste = testes.find((s) => s.id === testeEscolhido) ?? testes[0] ?? null
  const subgrupoId = porTeste ? (teste?.id ?? null) : null

  const faixas = useDados(
    async (): Promise<ClassificacaoResponse[]> =>
      porTeste && subgrupoId === null ? [] : classificacaoService.listar(indicador, subgrupoId),
    [indicador, subgrupoId],
  )

  const blocos = agrupar(faixas.dados ?? [])
  const podeCadastrar = !porTeste || subgrupoId !== null
  const contexto = porTeste
    ? `${teste?.nmSubgrupo ?? ''} · ${grupo.dados?.nmGrupo ?? ''}`
    : `${rotuloIndicador[indicador]}, para qualquer grupo`

  const fechar = () => setDialogo(null)
  const salvo = () => {
    fechar()
    faixas.recarregar()
  }
  const novaFaixa = (inicial?: FaixaInicial) => setDialogo({ tipo: 'faixa', inicial })

  return (
    <>
      <TituloPagina
        titulo="Faixas de classificação"
        descricao="Transformam o número do resultado numa palavra que todo mundo entende."
        acao={
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            disabled={!podeCadastrar}
            onClick={() =>
              novaFaixa(
                porTeste && grupo.dados
                  ? { tpSexo: 'FEMININO', nrIdadeMin: grupo.dados.nrIdadeMin, nrIdadeMax: grupo.dados.nrIdadeMax }
                  : undefined,
              )
            }
          >
            Nova faixa
          </Button>
        }
      />

      <Card
        sx={{
          p: 2.25,
          mb: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          alignItems: 'start',
          gap: 2,
        }}
      >
        <TextField
          select
          label="O que classifica"
          value={indicador}
          onChange={(e) => setIndicador(e.target.value as TipoIndicador)}
        >
          {indicadores.map((item) => (
            <MenuItem key={item} value={item}>
              {rotuloIndicador[item]}
            </MenuItem>
          ))}
        </TextField>
        {porTeste ? (
          <>
            <TextField
              select
              label="Grupo"
              value={grupoId ?? ''}
              onChange={(e) => {
                setGrupoEscolhido(Number(e.target.value))
                setTesteEscolhido(null)
              }}
            >
              {(grupos.dados ?? []).map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.nmGrupo} · {faixaEtaria(g.nrIdadeMin, g.nrIdadeMax)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Teste"
              value={teste?.id ?? ''}
              onChange={(e) => setTesteEscolhido(Number(e.target.value))}
              disabled={testes.length === 0}
              helperText={grupo.dados && testes.length === 0 ? 'Este grupo não tem teste de maior ou menor valor.' : undefined}
            >
              {testes.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.nmSubgrupo}
                </MenuItem>
              ))}
            </TextField>
          </>
        ) : (
          <Dica>IMC e RCE não dependem de teste: as faixas valem para qualquer grupo.</Dica>
        )}
      </Card>

      <Box sx={{ mb: 2 }}>
        <Dica destaque>
          Como ler: cada bloco vale "a partir de" um valor. Com blocos a partir de 0, 100 e 120, um resultado de 125 fica
          no último, e um de 100 já entra no do meio.
          {porTeste && teste?.tpCalculo === 'MENOR_VALOR' && ' Neste teste, menor é melhor: o bloco a partir de 0 guarda os melhores resultados.'}
        </Dica>
      </Box>

      {faixas.carregando && <Carregando />}
      {faixas.erro && <Alert severity="error">{faixas.erro}</Alert>}
      {faixas.dados && podeCadastrar && blocos.length === 0 && (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 700 }}>Nenhuma faixa por aqui ainda.</Typography>
          <Typography sx={{ color: 'text.secondary' }}>Use "Nova faixa" para criar a primeira.</Typography>
        </Card>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {blocos.map((bloco) => (
          <Card key={bloco.chave} component="section" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25 }}>
              <Etiqueta cor={corSexo[bloco.tpSexo]} texto={rotuloSexo[bloco.tpSexo]} />
              <Typography variant="h3" component="h2" sx={{ fontSize: 18 }}>
                {faixaEtaria(bloco.nrIdadeMin, bloco.nrIdadeMax)}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddRounded />}
                onClick={() =>
                  novaFaixa({ tpSexo: bloco.tpSexo, nrIdadeMin: bloco.nrIdadeMin, nrIdadeMax: bloco.nrIdadeMax })
                }
                sx={{ ml: 'auto', borderStyle: 'dashed' }}
              >
                Adicionar faixa
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {bloco.faixas.map((faixa, indice) => {
                const cor = corDaPosicao(indice)
                return (
                  <ButtonBase
                    key={faixa.id}
                    aria-label={`Editar a faixa ${faixa.dsClassificacao}, a partir de ${formatarNumero(faixa.vlInicio)}`}
                    onClick={() => setDialogo({ tipo: 'faixa', faixa })}
                    sx={{
                      flex: '1 1 150px',
                      minHeight: 68,
                      px: 2,
                      py: 1.25,
                      borderRadius: '16px',
                      bgcolor: cor.fundo,
                      color: cor.texto,
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      textAlign: 'left',
                    }}
                  >
                    <Box component="span" sx={{ fontSize: 16, fontWeight: 700 }}>
                      {faixa.dsClassificacao}
                    </Box>
                    <Box component="span" sx={{ fontSize: 13, fontWeight: 600 }}>
                      a partir de {formatarNumero(faixa.vlInicio)}
                    </Box>
                  </ButtonBase>
                )
              })}
            </Box>
          </Card>
        ))}
      </Box>

      {dialogo?.tipo === 'faixa' && (
        <FaixaDialog
          tpIndicador={indicador}
          subgrupoId={subgrupoId}
          contexto={contexto}
          faixa={dialogo.faixa}
          inicial={dialogo.inicial}
          onFechar={fechar}
          onSalvo={salvo}
          onExcluir={() => {
            if (dialogo.faixa) {
              setDialogo({ tipo: 'excluir', faixa: dialogo.faixa })
            }
          }}
        />
      )}

      {dialogo?.tipo === 'excluir' && (
        <DialogoExcluir
          titulo={`Excluir a faixa ${dialogo.faixa.dsClassificacao}?`}
          texto="As avaliações deixam de mostrar essa classificação."
          onFechar={fechar}
          onExcluir={async () => {
            await classificacaoService.excluir(dialogo.faixa.id)
            faixas.recarregar()
          }}
        />
      )}
    </>
  )
}

export default Classificacoes
