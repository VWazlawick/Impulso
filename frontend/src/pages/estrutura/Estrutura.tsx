import { useState } from 'react'
import { Alert, Box, Breadcrumbs, Button, ButtonBase, Card, Collapse, Link, Typography } from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import MenuBookRounded from '@mui/icons-material/MenuBookRounded'
import { Link as RouterLink, useParams } from 'react-router'
import BotaoIcone from '../../components/BotaoIcone.tsx'
import Carregando from '../../components/Carregando.tsx'
import DialogoExcluir from '../../components/DialogoExcluir.tsx'
import Emblema from '../../components/Emblema.tsx'
import Etiqueta from '../../components/Etiqueta.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { grupoService } from '../../services/grupoService.ts'
import { perguntaService } from '../../services/perguntaService.ts'
import { subgrupoService } from '../../services/subgrupoService.ts'
import type { PerguntaResponse } from '../../types/pergunta.ts'
import type { SubgrupoResponse } from '../../types/subgrupo.ts'
import { amarelo, lilas, neutro, perigo } from '../../utils/cores.ts'
import { contar, faixaEtaria } from '../../utils/formatos.ts'
import { corCalculo, rotuloCalculo, rotuloResposta } from '../../utils/rotulos.ts'
import PerguntaDialog from './PerguntaDialog.tsx'
import SubgrupoDialog from './SubgrupoDialog.tsx'

type Dialogo =
  | { tipo: 'subgrupo'; subgrupo?: SubgrupoResponse }
  | { tipo: 'pergunta'; subgrupo: SubgrupoResponse; pergunta?: PerguntaResponse }
  | { tipo: 'excluirSubgrupo'; subgrupo: SubgrupoResponse }
  | { tipo: 'excluirPergunta'; pergunta: PerguntaResponse }

// Ficha de um grupo: os subgrupos (testes e habilidades) e as perguntas de cada um.
function Estrutura() {
  const id = Number(useParams().id)
  const { dados: grupo, carregando, erro, recarregar } = useDados(() => grupoService.buscarPorId(id), [id])
  const [abertos, setAbertos] = useState<Record<number, boolean>>({})
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)

  const fechar = () => setDialogo(null)
  const salvo = () => {
    fechar()
    recarregar()
  }

  if (carregando) {
    return <Carregando />
  }

  if (!grupo) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
        <Alert severity="error">{erro || 'Grupo não encontrado!'}</Alert>
        <Button component={RouterLink} to="/grupos" variant="outlined">
          Voltar para os grupos
        </Button>
      </Box>
    )
  }

  const proximaOrdem = grupo.subgrupos.reduce((maior, s) => Math.max(maior, s.nrOrdem), 0) + 1

  return (
    <>
      <Breadcrumbs sx={{ mb: 2, fontWeight: 600 }}>
        <Link component={RouterLink} to="/grupos" underline="hover">
          Grupos
        </Link>
        <Typography sx={{ fontWeight: 600, color: 'text.secondary' }}>{grupo.nmGrupo}</Typography>
      </Breadcrumbs>

      <Card sx={{ p: 2.25, mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.75 }}>
        <Emblema cor={lilas} tamanho={56}>
          <MenuBookRounded />
        </Emblema>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
          <Typography variant="h1">{grupo.nmGrupo}</Typography>
          <Etiqueta cor={amarelo} texto={faixaEtaria(grupo.nrIdadeMin, grupo.nrIdadeMax)} />
        </Box>
        <Typography sx={{ flex: '1 1 220px', fontSize: 14, color: 'text.secondary' }}>
          Os testes e as perguntas aparecem na ficha nesta ordem.
        </Typography>
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => setDialogo({ tipo: 'subgrupo' })}>
          Novo subgrupo
        </Button>
      </Card>

      {grupo.subgrupos.length === 0 && (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 700 }}>Esta ficha ainda está vazia.</Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Comece pelo primeiro teste ou habilidade em "Novo subgrupo".
          </Typography>
        </Card>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {grupo.subgrupos.map((subgrupo, indice) => {
          const aberto = abertos[subgrupo.id] ?? indice === 0
          const cor = corCalculo[subgrupo.tpCalculo]

          return (
            <Card key={subgrupo.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, p: 1, pr: 1.5 }}>
                <ButtonBase
                  aria-expanded={aberto}
                  onClick={() => setAbertos({ ...abertos, [subgrupo.id]: !aberto })}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 60,
                    px: 1.25,
                    py: 0.75,
                    borderRadius: '16px',
                    justifyContent: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    textAlign: 'left',
                  }}
                >
                  <Emblema cor={cor}>{subgrupo.nrOrdem}</Emblema>
                  <Typography variant="h3" component="span" sx={{ fontSize: 19 }}>
                    {subgrupo.nmSubgrupo}
                  </Typography>
                  <Etiqueta cor={cor} texto={rotuloCalculo[subgrupo.tpCalculo]} />
                  <Etiqueta cor={neutro} texto={contar(subgrupo.perguntas.length, 'pergunta', 'perguntas')} />
                  <ExpandMoreRounded
                    sx={{
                      ml: 'auto',
                      color: 'text.secondary',
                      transition: 'transform 0.2s',
                      transform: aberto ? 'rotate(180deg)' : 'none',
                    }}
                  />
                </ButtonBase>
                <BotaoIcone
                  rotulo={`Editar ${subgrupo.nmSubgrupo}`}
                  cor={lilas}
                  onClick={() => setDialogo({ tipo: 'subgrupo', subgrupo })}
                >
                  <EditRounded fontSize="small" />
                </BotaoIcone>
                <BotaoIcone
                  rotulo={`Excluir ${subgrupo.nmSubgrupo}`}
                  cor={perigo}
                  onClick={() => setDialogo({ tipo: 'excluirSubgrupo', subgrupo })}
                >
                  <DeleteOutlineRounded fontSize="small" />
                </BotaoIcone>
              </Box>

              <Collapse in={aberto}>
                <Box
                  sx={{
                    mx: 1.75,
                    mb: 1.75,
                    p: 1,
                    borderRadius: '16px',
                    bgcolor: '#FBF9FF',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75,
                  }}
                >
                  {subgrupo.perguntas.map((pergunta) => (
                    <Box
                      key={pergunta.id}
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 1.25,
                        minHeight: 52,
                        px: 1,
                        py: 0.5,
                        borderRadius: '12px',
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Emblema cor={lilas} tamanho={28}>
                        {pergunta.nrOrdem}
                      </Emblema>
                      <Typography sx={{ fontWeight: 700 }}>{pergunta.dsPergunta}</Typography>
                      <Etiqueta cor={neutro} texto={rotuloResposta[pergunta.tpResposta]} />
                      {pergunta.dsUnidade && <Etiqueta cor={amarelo} texto={pergunta.dsUnidade} />}
                      <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                        <BotaoIcone
                          rotulo={`Editar ${pergunta.dsPergunta} de ${subgrupo.nmSubgrupo}`}
                          cor={lilas}
                          onClick={() => setDialogo({ tipo: 'pergunta', subgrupo, pergunta })}
                        >
                          <EditRounded fontSize="small" />
                        </BotaoIcone>
                        <BotaoIcone
                          rotulo={`Excluir ${pergunta.dsPergunta} de ${subgrupo.nmSubgrupo}`}
                          cor={perigo}
                          onClick={() => setDialogo({ tipo: 'excluirPergunta', pergunta })}
                        >
                          <DeleteOutlineRounded fontSize="small" />
                        </BotaoIcone>
                      </Box>
                    </Box>
                  ))}
                  <Button
                    variant="outlined"
                    startIcon={<AddRounded />}
                    onClick={() => setDialogo({ tipo: 'pergunta', subgrupo })}
                    sx={{ alignSelf: 'flex-start', mt: 0.5, borderStyle: 'dashed', bgcolor: 'background.paper' }}
                  >
                    Nova pergunta
                  </Button>
                </Box>
              </Collapse>
            </Card>
          )
        })}
      </Box>

      {dialogo?.tipo === 'subgrupo' && (
        <SubgrupoDialog
          grupoId={grupo.id}
          subgrupo={dialogo.subgrupo}
          ordemSugerida={proximaOrdem}
          onFechar={fechar}
          onSalvo={salvo}
        />
      )}

      {dialogo?.tipo === 'pergunta' && (
        <PerguntaDialog subgrupo={dialogo.subgrupo} pergunta={dialogo.pergunta} onFechar={fechar} onSalvo={salvo} />
      )}

      {dialogo?.tipo === 'excluirSubgrupo' && (
        <DialogoExcluir
          titulo={`Excluir o subgrupo ${dialogo.subgrupo.nmSubgrupo}?`}
          onFechar={fechar}
          onExcluir={async () => {
            await subgrupoService.excluir(dialogo.subgrupo.id)
            recarregar()
          }}
        />
      )}

      {dialogo?.tipo === 'excluirPergunta' && (
        <DialogoExcluir
          titulo={`Excluir a pergunta ${dialogo.pergunta.dsPergunta}?`}
          onFechar={fechar}
          onExcluir={async () => {
            await perguntaService.excluir(dialogo.pergunta.id)
            recarregar()
          }}
        />
      )}
    </>
  )
}

export default Estrutura
