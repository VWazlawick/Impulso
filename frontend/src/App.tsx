import { Route, Routes } from 'react-router'
import Layout from './layout/Layout.tsx'
import AlunoDetalhe from './pages/alunos/AlunoDetalhe.tsx'
import AlunoFormulario from './pages/alunos/AlunoFormulario.tsx'
import Alunos from './pages/alunos/Alunos.tsx'
import AvaliacaoDetalhe from './pages/avaliacoes/AvaliacaoDetalhe.tsx'
import CorrigirAvaliacao from './pages/avaliacoes/CorrigirAvaliacao.tsx'
import NovaAvaliacao from './pages/avaliacoes/NovaAvaliacao.tsx'
import Classificacoes from './pages/classificacoes/Classificacoes.tsx'
import Empresa from './pages/empresa/Empresa.tsx'
import Estrutura from './pages/estrutura/Estrutura.tsx'
import Familia from './pages/familia/Familia.tsx'
import FamiliaAluno from './pages/familia/FamiliaAluno.tsx'
import Grupos from './pages/grupos/Grupos.tsx'
import Login from './pages/login/Login.tsx'
import Profissionais from './pages/profissionais/Profissionais.tsx'
import Responsaveis from './pages/responsaveis/Responsaveis.tsx'
import IrParaInicio from './sessao/IrParaInicio.tsx'
import RequerPerfil from './sessao/RequerPerfil.tsx'
import SessaoProvider from './sessao/SessaoProvider.tsx'

// As rotas de cada perfil. O RequerPerfil sem perfis só exige ter entrado.
function App() {
  return (
    <SessaoProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<RequerPerfil />}>
          <Route element={<Layout />}>
            <Route element={<RequerPerfil perfis={['ADMIN', 'PROFISSIONAL']} />}>
              <Route path="/alunos" element={<Alunos />} />
              <Route path="/alunos/novo" element={<AlunoFormulario />} />
              <Route path="/alunos/:id" element={<AlunoDetalhe />} />
              <Route path="/alunos/:id/editar" element={<AlunoFormulario />} />
              <Route path="/avaliacoes/nova" element={<NovaAvaliacao />} />
              <Route path="/alunos/:id/avaliacoes/:avaliacaoId" element={<AvaliacaoDetalhe />} />
              <Route path="/alunos/:id/avaliacoes/:avaliacaoId/corrigir" element={<CorrigirAvaliacao />} />
              <Route path="/responsaveis" element={<Responsaveis />} />
            </Route>

            <Route element={<RequerPerfil perfis={['ADMIN']} />}>
              <Route path="/profissionais" element={<Profissionais />} />
              <Route path="/grupos" element={<Grupos />} />
              <Route path="/grupos/:id" element={<Estrutura />} />
              <Route path="/classificacoes" element={<Classificacoes />} />
              <Route path="/empresa" element={<Empresa />} />
            </Route>

            <Route element={<RequerPerfil perfis={['RESPONSAVEL']} />}>
              <Route path="/familia" element={<Familia />} />
              <Route path="/familia/:id" element={<FamiliaAluno />} />
              <Route path="/familia/:id/avaliacoes/:avaliacaoId" element={<AvaliacaoDetalhe familia />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<IrParaInicio />} />
      </Routes>
    </SessaoProvider>
  )
}

export default App
