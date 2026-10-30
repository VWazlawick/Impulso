import { useState } from 'react'
import { Alert, Box, Button, Card, Typography } from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import HomeRounded from '@mui/icons-material/HomeRounded'
import BotaoIcone from '../../components/BotaoIcone.tsx'
import Carregando from '../../components/Carregando.tsx'
import DialogoExcluir from '../../components/DialogoExcluir.tsx'
import Emblema from '../../components/Emblema.tsx'
import EstadoVazio from '../../components/EstadoVazio.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { enderecoService } from '../../services/enderecoService.ts'
import type { EnderecoResponse } from '../../types/endereco.ts'
import { azul, lilas, perigo } from '../../utils/cores.ts'
import { formatarCep } from '../../utils/documentos.ts'
import EnderecoDialog from './EnderecoDialog.tsx'

type Dialogo = { tipo: 'endereco'; endereco?: EnderecoResponse } | { tipo: 'excluir'; endereco: EnderecoResponse }

function AbaEnderecos({ alunoId }: { alunoId: number }) {
  const enderecos = useDados(() => enderecoService.listar(alunoId), [alunoId])
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)

  const fechar = () => setDialogo(null)

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => setDialogo({ tipo: 'endereco' })}>
          Novo endereço
        </Button>
      </Box>

      {enderecos.carregando && <Carregando />}
      {enderecos.erro && <Alert severity="error">{enderecos.erro}</Alert>}
      {enderecos.dados && enderecos.dados.length === 0 && <EstadoVazio titulo="Nenhum endereço cadastrado." />}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {(enderecos.dados ?? []).map((endereco) => (
          <Card key={endereco.id} sx={{ p: 1.75, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
            <Emblema cor={azul} tamanho={44}>
              <HomeRounded />
            </Emblema>
            <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }}>
                {endereco.rua}, {endereco.nrCasa}
                {endereco.complemento ? ` · ${endereco.complemento}` : ''}
              </Typography>
              <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
                {endereco.bairro} · {endereco.nmCidade}/{endereco.sgEstado} · CEP {formatarCep(endereco.cep)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              <BotaoIcone rotulo="Editar endereço" cor={lilas} onClick={() => setDialogo({ tipo: 'endereco', endereco })}>
                <EditRounded fontSize="small" />
              </BotaoIcone>
              <BotaoIcone rotulo="Excluir endereço" cor={perigo} onClick={() => setDialogo({ tipo: 'excluir', endereco })}>
                <DeleteOutlineRounded fontSize="small" />
              </BotaoIcone>
            </Box>
          </Card>
        ))}
      </Box>

      {dialogo?.tipo === 'endereco' && (
        <EnderecoDialog
          alunoId={alunoId}
          endereco={dialogo.endereco}
          onFechar={fechar}
          onSalvo={() => {
            fechar()
            enderecos.recarregar()
          }}
        />
      )}
      {dialogo?.tipo === 'excluir' && (
        <DialogoExcluir
          titulo="Excluir este endereço?"
          onFechar={fechar}
          onExcluir={async () => {
            await enderecoService.excluir(alunoId, dialogo.endereco.id)
            enderecos.recarregar()
          }}
        />
      )}
    </>
  )
}

export default AbaEnderecos
