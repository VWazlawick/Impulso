import { useState } from 'react'
import { Alert, Box, Button, ButtonBase, Card, Typography } from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import MenuBookRounded from '@mui/icons-material/MenuBookRounded'
import { Link as RouterLink } from 'react-router'
import BotaoIcone from '../../components/BotaoIcone.tsx'
import Carregando from '../../components/Carregando.tsx'
import DialogoExcluir from '../../components/DialogoExcluir.tsx'
import Emblema from '../../components/Emblema.tsx'
import Etiqueta from '../../components/Etiqueta.tsx'
import TituloPagina from '../../components/TituloPagina.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { grupoService } from '../../services/grupoService.ts'
import type { GrupoResponse } from '../../types/grupo.ts'
import { amarelo, corDaPosicao, lilas, perigo } from '../../utils/cores.ts'
import { contar, faixaEtaria } from '../../utils/formatos.ts'
import GrupoDialog from './GrupoDialog.tsx'

type Dialogo = { tipo: 'grupo'; grupo?: GrupoResponse } | { tipo: 'excluir'; grupo: GrupoResponse }

function Grupos() {
  const { dados: grupos, carregando, erro, recarregar } = useDados(() => grupoService.listar(), [])
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)

  const fechar = () => setDialogo(null)
  const novoGrupo = () => setDialogo({ tipo: 'grupo' })

  return (
    <>
      <TituloPagina
        titulo="Grupos"
        descricao="Cada grupo é a ficha de uma faixa etária. A idade da criança na data da avaliação escolhe o grupo."
        acao={
          <Button variant="contained" startIcon={<AddRounded />} onClick={novoGrupo}>
            Novo grupo
          </Button>
        }
      />

      {carregando && <Carregando />}
      {erro && <Alert severity="error">{erro}</Alert>}

      {grupos && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2 }}>
          {grupos.map((grupo, indice) => (
            <Card key={grupo.id} sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Emblema cor={corDaPosicao(indice)} tamanho={52}>
                  {indice + 1}
                </Emblema>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                  <Typography variant="h3" component="h2">
                    {grupo.nmGrupo}
                  </Typography>
                  <Etiqueta cor={amarelo} texto={faixaEtaria(grupo.nrIdadeMin, grupo.nrIdadeMax)} />
                </Box>
              </Box>
              <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
                {grupo.qtSubgrupos === 0
                  ? 'Nenhum subgrupo ainda'
                  : `${contar(grupo.qtSubgrupos, 'subgrupo', 'subgrupos')} na ficha`}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 'auto' }}>
                <Button
                  component={RouterLink}
                  to={`/grupos/${grupo.id}`}
                  startIcon={<MenuBookRounded />}
                  sx={{ flex: 1, bgcolor: lilas.fundo, color: lilas.texto, '&:hover': { bgcolor: '#E2DAF7' } }}
                >
                  Abrir ficha
                </Button>
                <BotaoIcone rotulo={`Editar ${grupo.nmGrupo}`} cor={lilas} onClick={() => setDialogo({ tipo: 'grupo', grupo })}>
                  <EditRounded fontSize="small" />
                </BotaoIcone>
                <BotaoIcone rotulo={`Excluir ${grupo.nmGrupo}`} cor={perigo} onClick={() => setDialogo({ tipo: 'excluir', grupo })}>
                  <DeleteOutlineRounded fontSize="small" />
                </BotaoIcone>
              </Box>
            </Card>
          ))}

          <ButtonBase
            onClick={novoGrupo}
            sx={{
              minHeight: 150,
              borderRadius: '20px',
              border: '2px dashed #C5B6EE',
              color: 'primary.dark',
              flexDirection: 'column',
              gap: 1.25,
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            <Emblema cor={lilas} tamanho={48}>
              <AddRounded />
            </Emblema>
            Criar outro grupo
          </ButtonBase>
        </Box>
      )}

      {dialogo?.tipo === 'grupo' && (
        <GrupoDialog
          grupo={dialogo.grupo}
          onFechar={fechar}
          onSalvo={() => {
            fechar()
            recarregar()
          }}
        />
      )}

      {dialogo?.tipo === 'excluir' && (
        <DialogoExcluir
          titulo={`Excluir ${dialogo.grupo.nmGrupo}?`}
          onFechar={fechar}
          onExcluir={async () => {
            await grupoService.excluir(dialogo.grupo.id)
            recarregar()
          }}
        />
      )}
    </>
  )
}

export default Grupos
