import { ref } from 'vue'
import { supabase } from 'src/services/supabase'
import { useAuthStore } from 'src/stores/authStore'
import { useQuasar } from 'quasar'

// Estrutura pronta — UI implementada na próxima etapa
export const useAnexos = () => {
  const authStore = useAuthStore()
  const $q = useQuasar()
  const enviando = ref(false)
  const progresso = ref(0)

  const uploadAnexo = async ({ arquivo, pacienteId }) => {
    if (!arquivo || !pacienteId) return { sucesso: false, mensagem: 'Dados inválidos.' }

    enviando.value = true
    progresso.value = 0
    const resultado = { sucesso: false, retorno: null, mensagem: '' }

    try {
      const extensao = arquivo.name.split('.').pop()
      const nomeStorage = `${authStore.profissionalId}/${pacienteId}/${Date.now()}.${extensao}`

      // 1. Upload para o Supabase Storage
      const { data: dadosStorage, error: erroStorage } = await supabase.storage
        .from('anexos')
        .upload(nomeStorage, arquivo, {
          cacheControl: '3600',
          upsert: false,
        })

      if (erroStorage) {
        resultado.mensagem = erroStorage.message
        enviando.value = false
        return resultado
      }

      // 2. Gera URL pública
      const { data: dadosUrl } = supabase.storage.from('anexos').getPublicUrl(nomeStorage)

      // 3. Registra no banco
      const { data: dadosBanco, error: erroBanco } = await supabase
        .from('anexos')
        .insert({
          paciente_id: pacienteId,
          profissional_id: authStore.profissionalId,
          nome_arquivo: arquivo.name,
          url_storage: dadosUrl.publicUrl,
          tipo_mime: arquivo.type,
          tamanho_bytes: arquivo.size,
        })
        .select()
        .single()

      if (erroBanco) {
        resultado.mensagem = erroBanco.message
      } else {
        resultado.sucesso = true
        resultado.retorno = dadosBanco
        resultado.mensagem = 'Arquivo enviado!'
      }
    } catch (erro) {
      resultado.mensagem = 'Erro ao enviar arquivo.'
      console.error('[Anexos] uploadAnexo:', erro)
    }

    enviando.value = false
    progresso.value = 0
    return resultado
  }

  const excluirAnexo = async (anexo) => {
    const resultado = { sucesso: false, mensagem: '' }

    try {
      // Extrai o caminho relativo da URL para deletar do Storage
      const urlStorage = anexo.url_storage
      const caminhoRelativo = urlStorage.split('/storage/v1/object/public/anexos/')[1]

      if (caminhoRelativo) {
        await supabase.storage.from('anexos').remove([caminhoRelativo])
      }

      const { error } = await supabase.from('anexos').delete().eq('id', anexo.id)

      if (error) {
        resultado.mensagem = error.message
      } else {
        resultado.sucesso = true
        resultado.mensagem = 'Arquivo removido.'
      }
    } catch (erro) {
      resultado.mensagem = 'Erro ao remover arquivo.'
      console.error('[Anexos] excluirAnexo:', erro)
    }

    return resultado
  }

  // Gera link de compartilhamento com expiração (1h por padrão)
  const gerarLinkCompartilhamento = async (urlStorage, expiracaoSegundos = 3600) => {
    const caminhoRelativo = urlStorage.split('/storage/v1/object/public/anexos/')[1]
    if (!caminhoRelativo) return null

    const { data, error } = await supabase.storage
      .from('anexos')
      .createSignedUrl(caminhoRelativo, expiracaoSegundos)

    if (error) {
      $q.notify({ type: 'negative', message: 'Erro ao gerar link.' })
      return null
    }

    return data.signedUrl
  }

  return {
    enviando,
    progresso,
    uploadAnexo,
    excluirAnexo,
    gerarLinkCompartilhamento,
  }
}
