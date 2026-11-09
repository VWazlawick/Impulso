import axios, { type AxiosError } from "axios"
import { ErroApi } from './erros.ts'
import { lerSessao, limparSessao} from "./sessao.ts"

export const api = axios.create({ baseURL: '/api/' })

api.interceptors.request.use((config) => {
    const sessao = lerSessao()
    if (sessao){
        config.headers.Authorization = `Bearer ${sessao.token}`
    }
    return config
})

type CorpoDeErro = { erro?: string; campos?: Record<string, string> }

api.interceptors.response.use(
    (resposta) => resposta,
    (erro: AxiosError<CorpoDeErro>) => {
        const status = erro.response?.status ?? 0
        const corpo = typeof erro.response?.data === 'object' && erro.response?.data !== null ? erro.response.data : {}
        const ehLogin = erro.config?.url?.endsWith('/auth/login') ?? false

        if(status == 401 && !ehLogin){
            limparSessao()
            window.location.assign('/login')
        }

        let mensagem = corpo.erro
        if (!mensagem){
            mensagem =
                status == 0 || status >= 500
            ? 'O servidor não responde. Confira se o backend está rodando e tente novamente!'
                    : `Erro ${status} ao falar com o servidor!`
        }
        return Promise.reject(new ErroApi(status, mensagem, corpo.campos ??{}))
    },
)