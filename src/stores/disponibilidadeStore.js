import { defineStore } from 'pinia'
import { supabase } from 'src/services/supabase'
import { useAuthStore } from './authStore'

export const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

export const useDisponibilidadeStore = defineStore('Disponibilidade', {
  state: () => ({
    disponibilidade: {},
    lista_disponibilidades: [],

    tipo_atendimento: {},
    lista_tipos_atendimento: [],

    bloqueio: {},
    lista_bloqueios: [],
  }),

  getters: {
    // Disponibilidades ativas agrupadas por dia da semana
    disponibilidades_por_dia: (state) => {
      const mapa = {}
      state.lista_disponibilidades
        .filter((disponibilidade) => disponibilidade.ativo)
        .forEach((disponibilidade) => {
          mapa[disponibilidade.dia_semana] = disponibilidade
        })
      return mapa
    },

    // Tipos de atendimento ativos para uso em selects
    tipos_atendimento_ativos: (state) => {
      return state.lista_tipos_atendimento.filter((tipo) => tipo.ativo)
    },
  },

  actions: {
    // ─── Disponibilidades ─────────────────────────────────────────────────

    async setListDisponibilidadesAction(obj) {
      const authStore = useAuthStore()
      const resultado = { sucesso: false, retorno: [], mensagem: '', status_code: null }

      if (!authStore.profissionalId) return resultado

      try {
        const { data, error, status } = await supabase
          .from('disponibilidades')
          .select('*')
          .eq('profissional_id', authStore.profissionalId)
          .order('dia_semana')

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.retorno = data
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao carregar disponibilidades.'
        console.error('[Disponibilidade] setListDisponibilidadesAction:', erro)
      }

      if (!obj?.preventState) this.lista_disponibilidades = resultado.retorno
      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    async upsertDisponibilidadeAction(obj) {
      const authStore = useAuthStore()
      const disponibilidade = obj?.disponibilidade ?? this.disponibilidade
      const resultado = { sucesso: false, retorno: null, mensagem: '', status_code: null }

      try {
        const { data, error, status } = await supabase
          .from('disponibilidades')
          .upsert({
            ...disponibilidade,
            profissional_id: authStore.profissionalId,
          })
          .select()
          .single()

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.retorno = data
          resultado.mensagem = 'Disponibilidade salva!'
          await this.setListDisponibilidadesAction({ preventState: false })
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao salvar disponibilidade.'
        console.error('[Disponibilidade] upsertDisponibilidadeAction:', erro)
      }

      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    // ─── Tipos de atendimento ─────────────────────────────────────────────

    async setListTiposAtendimentoAction(obj) {
      const authStore = useAuthStore()
      const resultado = { sucesso: false, retorno: [], mensagem: '', status_code: null }

      if (!authStore.profissionalId) return resultado

      try {
        const { data, error, status } = await supabase
          .from('tipos_atendimento')
          .select('*')
          .eq('profissional_id', authStore.profissionalId)
          .order('nome')

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.retorno = data
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao carregar tipos de atendimento.'
        console.error('[Disponibilidade] setListTiposAtendimentoAction:', erro)
      }

      if (!obj?.preventState) this.lista_tipos_atendimento = resultado.retorno
      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    async postTipoAtendimentoAction(obj) {
      const authStore = useAuthStore()
      const tipo = obj?.tipo ?? this.tipo_atendimento
      const resultado = { sucesso: false, retorno: null, mensagem: '', status_code: null }

      try {
        const { data, error, status } = await supabase
          .from('tipos_atendimento')
          .insert({ ...tipo, profissional_id: authStore.profissionalId, ativo: true })
          .select()
          .single()

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.retorno = data
          resultado.mensagem = 'Tipo de atendimento criado!'
          this.lista_tipos_atendimento.push(data)
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao criar tipo de atendimento.'
        console.error('[Disponibilidade] postTipoAtendimentoAction:', erro)
      }

      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    async putTipoAtendimentoAction(obj) {
      const tipo = obj?.tipo ?? this.tipo_atendimento
      const resultado = { sucesso: false, retorno: null, mensagem: '', status_code: null }

      try {
        const { data, error, status } = await supabase
          .from('tipos_atendimento')
          .update(tipo)
          .eq('id', tipo.id)
          .select()
          .single()

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.retorno = data
          resultado.mensagem = 'Tipo atualizado!'
          const indice = this.lista_tipos_atendimento.findIndex((item) => item.id === data.id)
          if (indice !== -1) this.lista_tipos_atendimento[indice] = data
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao atualizar tipo de atendimento.'
        console.error('[Disponibilidade] putTipoAtendimentoAction:', erro)
      }

      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    async deleteTipoAtendimentoAction(obj) {
      const tipo = obj?.tipo ?? this.tipo_atendimento
      const resultado = { sucesso: false, retorno: null, mensagem: '', status_code: null }

      try {
        // Soft delete — desativa em vez de remover (preserva histórico de agendamentos)
        const { data, error, status } = await supabase
          .from('tipos_atendimento')
          .update({ ativo: false })
          .eq('id', tipo.id)
          .select()
          .single()

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.mensagem = 'Tipo desativado.'
          const indice = this.lista_tipos_atendimento.findIndex((item) => item.id === tipo.id)
          if (indice !== -1) this.lista_tipos_atendimento[indice] = data
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao desativar tipo de atendimento.'
        console.error('[Disponibilidade] deleteTipoAtendimentoAction:', erro)
      }

      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    // ─── Bloqueios ────────────────────────────────────────────────────────

    async setListBloqueiosAction(obj) {
      const authStore = useAuthStore()
      const resultado = { sucesso: false, retorno: [], mensagem: '', status_code: null }

      if (!authStore.profissionalId) return resultado

      try {
        let query = supabase
          .from('bloqueios')
          .select('*')
          .eq('profissional_id', authStore.profissionalId)
          .order('data_hora_inicio')

        if (obj?.data_inicio) {
          query = query.gte('data_hora_inicio', obj.data_inicio)
        }

        const { data, error, status } = await query

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.retorno = data
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao carregar bloqueios.'
        console.error('[Disponibilidade] setListBloqueiosAction:', erro)
      }

      if (!obj?.preventState) this.lista_bloqueios = resultado.retorno
      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    async postBloqueioAction(obj) {
      const authStore = useAuthStore()
      const bloqueio = obj?.bloqueio ?? this.bloqueio
      const resultado = { sucesso: false, retorno: null, mensagem: '', status_code: null }

      try {
        const { data, error, status } = await supabase
          .from('bloqueios')
          .insert({ ...bloqueio, profissional_id: authStore.profissionalId })
          .select()
          .single()

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.retorno = data
          resultado.mensagem = 'Horário bloqueado.'
          this.lista_bloqueios.push(data)
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao bloquear horário.'
        console.error('[Disponibilidade] postBloqueioAction:', erro)
      }

      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    async deleteBloqueioAction(obj) {
      const bloqueio = obj?.bloqueio ?? this.bloqueio
      const resultado = { sucesso: false, retorno: null, mensagem: '', status_code: null }

      try {
        const { error, status } = await supabase
          .from('bloqueios')
          .delete()
          .eq('id', bloqueio.id)

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.mensagem = 'Bloqueio removido.'
          this.lista_bloqueios = this.lista_bloqueios.filter((item) => item.id !== bloqueio.id)
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao remover bloqueio.'
        console.error('[Disponibilidade] deleteBloqueioAction:', erro)
      }

      if (obj?.callback) obj.callback(resultado)
      return resultado
    },
  },
})
