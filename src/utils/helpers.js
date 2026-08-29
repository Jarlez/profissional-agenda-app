import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'

dayjs.extend(relativeTime)
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.locale('pt-br')

// ─── Formatação de datas ───────────────────────────────────────────────────

export const formatarData = (valor) => {
  if (!valor) return ''
  return dayjs(valor).format('DD/MM/YYYY')
}

export const formatarDataHora = (valor) => {
  if (!valor) return ''
  return dayjs(valor).format('DD/MM/YYYY HH:mm')
}

export const formatarHora = (valor) => {
  if (!valor) return ''
  return dayjs(valor).format('HH:mm')
}

export const formatarDataRelativa = (valor) => {
  if (!valor) return ''
  return dayjs(valor).fromNow()
}

export const formatarDataExtenso = (valor) => {
  if (!valor) return ''
  return dayjs(valor).format('dddd, D [de] MMMM [de] YYYY')
}

// ─── Formatação de valores ─────────────────────────────────────────────────

export const formatarDinheiro = (valor) => {
  if (valor === null || valor === undefined) return ''
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

export const formatarTelefone = (valor) => {
  if (!valor) return ''
  const soNumeros = String(valor).replace(/\D/g, '')
  if (soNumeros.length === 11) {
    return soNumeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (soNumeros.length === 10) {
    return soNumeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return valor
}

export const formatarTamanhoArquivo = (bytes) => {
  if (!bytes) return '0 B'
  const unidades = ['B', 'KB', 'MB', 'GB']
  const indice = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, indice)).toFixed(1)} ${unidades[indice]}`
}

// ─── Cálculos ──────────────────────────────────────────────────────────────

export const calcularIdade = (dataNascimento) => {
  if (!dataNascimento) return null
  return dayjs().diff(dayjs(dataNascimento), 'year')
}

export const calcularTempoAte = (dataHora) => {
  if (!dataHora) return ''
  const diff = dayjs(dataHora).diff(dayjs(), 'minute')
  if (diff < 0) return 'passou'
  if (diff < 60) return `em ${diff} min`
  const horas = Math.floor(diff / 60)
  if (horas < 24) return `em ${horas}h`
  return dayjs(dataHora).fromNow()
}

export const diferencaMinutos = (dataHoraInicio, dataHoraFim) => {
  return dayjs(dataHoraFim).diff(dayjs(dataHoraInicio), 'minute')
}

// ─── Geração de slug ───────────────────────────────────────────────────────

export const gerarSlug = (texto) => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ─── Validações ────────────────────────────────────────────────────────────

export const validarTelefone = (valor) => {
  if (!valor) return false
  const soNumeros = String(valor).replace(/\D/g, '')
  return soNumeros.length === 10 || soNumeros.length === 11
}

export const validarEmail = (valor) => {
  if (!valor) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
}

// ─── Helpers de array ─────────────────────────────────────────────────────

export const ordenarPor = (lista, campo, ordem = 'asc') => {
  return [...lista].sort((anterior, proximo) => {
    const valorAnterior = anterior[campo] ?? ''
    const valorProximo = proximo[campo] ?? ''
    if (valorAnterior < valorProximo) return ordem === 'asc' ? -1 : 1
    if (valorAnterior > valorProximo) return ordem === 'asc' ? 1 : -1
    return 0
  })
}

export const filtrarPorTexto = (lista, texto, campos) => {
  if (!texto) return lista
  const textoPadronizado = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

  return lista.filter((item) =>
    campos.some((campo) => {
      const valor = String(item[campo] ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
      return valor.includes(textoPadronizado)
    }),
  )
}

// ─── Retorno padrão das actions da store ──────────────────────────────────

export const retornoPadrao = (sucesso = false) => ({
  sucesso,
  retorno: null,
  mensagem: '',
  status_code: null,
})

export default {
  formatarData,
  formatarDataHora,
  formatarHora,
  formatarDataRelativa,
  formatarDataExtenso,
  formatarDinheiro,
  formatarTelefone,
  formatarTamanhoArquivo,
  calcularIdade,
  calcularTempoAte,
  diferencaMinutos,
  gerarSlug,
  validarTelefone,
  validarEmail,
  ordenarPor,
  filtrarPorTexto,
  retornoPadrao,
}
