import { defineStore } from 'pinia'
import { supabase } from 'src/services/supabase'
import { useAuthStore } from './authStore'
import { filtrarPorTexto, ordenarPor } from 'src/utils/helpers'

export const useContatosStore = defineStore('Contatos', {
  state: () => ({
    configs: {
      orderBy: 'nome',
      order: 'asc',
      filter_value: '',
    },
    contato: {},
    lista_contatos: [],
  }),

  getters: {
    lista_contatos_ordenada: (state) => {
      const lista = filtrarPorTexto(state.lista_contatos, state.configs.filter_value, [
        'nome',
        'telefone',
        'email',
      ])
      return ordenarPor(lista, state.configs.orderBy, state.configs.order)
    },
  },

  actions: {
    async setListContatosAction(obj) {
      const authStore = useAuthStore()
      const resultado = { sucesso: false, retorno: [], mensagem: '', status_code: null }

      try {
        const { data, error, status } = await supabase
          .from('contatos')
          .select('*')
          .eq('profissional_id', authStore.profissionalId)
          .order('nome')

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.retorno = data
          resultado.mensagem = 'Contatos carregados.'
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao carregar contatos.'
        console.error('[Contatos] setListContatosAction:', erro)
      }

      if (!obj?.preventState) this.lista_contatos = resultado.retorno
      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    async setContatoByIdAction(obj) {
      const resultado = { sucesso: false, retorno: {}, mensagem: '', status_code: null }

      try {
        const { data, error, status } = await supabase
          .from('contatos')
          .select('*')
          .eq('id', obj.id)
          .single()

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.retorno = data
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao carregar contato.'
        console.error('[Contatos] setContatoByIdAction:', erro)
      }

      if (!obj?.preventState) this.contato = resultado.retorno
      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    async postContatoAction(obj) {
      const authStore = useAuthStore()
      const contato = obj?.contato ?? this.contato
      const resultado = { sucesso: false, retorno: null, mensagem: '', status_code: null }

      try {
        const { data, error, status } = await supabase
          .from('contatos')
          .insert({ ...contato, profissional_id: authStore.profissionalId })
          .select()
          .single()

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.retorno = data
          resultado.mensagem = 'Contato criado com sucesso!'
          this.lista_contatos.push(data)
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao criar contato.'
        console.error('[Contatos] postContatoAction:', erro)
      }

      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    async putContatoAction(obj) {
      const contato = obj?.contato ?? this.contato
      const resultado = { sucesso: false, retorno: null, mensagem: '', status_code: null }

      try {
        const { data, error, status } = await supabase
          .from('contatos')
          .update(contato)
          .eq('id', contato.id)
          .select()
          .single()

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.retorno = data
          resultado.mensagem = 'Contato atualizado!'
          const indice = this.lista_contatos.findIndex((item) => item.id === data.id)
          if (indice !== -1) this.lista_contatos[indice] = data
          this.contato = data
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao atualizar contato.'
        console.error('[Contatos] putContatoAction:', erro)
      }

      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    async deleteContatoAction(obj) {
      const contato = obj?.contato ?? this.contato
      const resultado = { sucesso: false, retorno: null, mensagem: '', status_code: null }

      try {
        const { error, status } = await supabase
          .from('contatos')
          .delete()
          .eq('id', contato.id)

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.mensagem = 'Contato removido.'
          this.lista_contatos = this.lista_contatos.filter((item) => item.id !== contato.id)
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao remover contato.'
        console.error('[Contatos] deleteContatoAction:', erro)
      }

      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    iniciarContatoAction(obj) {
      const contato = obj?.contato ?? {}
      if (!obj?.preventState) this.contato = contato
      return contato
    },
  },
})
