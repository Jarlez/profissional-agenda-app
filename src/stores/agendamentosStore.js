import { defineStore } from 'pinia'
import { supabase } from 'src/services/supabase'
import { useAuthStore } from './authStore'

// Status possíveis de um agendamento
export const STATUS_AGENDAMENTO = {
  AGENDADO: 'agendado',
  CONFIRMADO: 'confirmado',
  CANCELADO: 'cancelado',
  REALIZADO: 'realizado',
  FALTA: 'falta',
}

export const useAgendamentosStore = defineStore('Agendamentos', {
  state: () => ({
    carregando: false,
    configs: {
      data_inicio: null,
      data_fim: null,
      filter_status: [],
    },
    agendamento: {},
    lista_agendamentos: [],
  }),

  getters: {
    // Agendamentos do dia atual
    agendamentos_hoje: (state) => {
      const hoje = new Date().toISOString().split('T')[0]
      return state.lista_agendamentos
        .filter((agendamento) => agendamento.data_hora?.startsWith(hoje))
        .sort((anterior, proximo) => anterior.data_hora?.localeCompare(proximo.data_hora))
    },

    // Agendamentos pendentes de confirmação
    agendamentos_pendentes: (state) => {
      return state.lista_agendamentos.filter(
        (agendamento) => agendamento.status === STATUS_AGENDAMENTO.AGENDADO,
      )
    },

    // Total de faltas no mês atual
    total_faltas_mes: (state) => {
      const mesAtual = new Date().toISOString().substring(0, 7)
      return state.lista_agendamentos.filter(
        (agendamento) =>
          agendamento.status === STATUS_AGENDAMENTO.FALTA &&
          agendamento.data_hora?.startsWith(mesAtual),
      ).length
    },
  },

  actions: {
    // Carrega agendamentos com join em contatos e tipos_atendimento
    async setListAgendamentosAction(obj) {
      const authStore = useAuthStore()
      const resultado = { sucesso: false, retorno: [], mensagem: '', status_code: null }

      if (!authStore.profissionalId) return resultado

      this.carregando = true

      try {
        let query = supabase
          .from('agendamentos')
          .select(`
            *,
            contatos (id, nome, telefone, email),
            tipos_atendimento (id, nome, duracao_minutos, valor)
          `)
          .eq('profissional_id', authStore.profissionalId)
          .order('data_hora')

        if (obj?.data_inicio) {
          query = query.gte('data_hora', obj.data_inicio)
        }
        if (obj?.data_fim) {
          query = query.lte('data_hora', obj.data_fim)
        }
        if (obj?.status) {
          query = query.in('status', Array.isArray(obj.status) ? obj.status : [obj.status])
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
        resultado.mensagem = 'Erro ao carregar agendamentos.'
        console.error('[Agendamentos] setListAgendamentosAction:', erro)
      }

      this.carregando = false
      if (!obj?.preventState) this.lista_agendamentos = resultado.retorno
      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    async setAgendamentoByIdAction(obj) {
      const resultado = { sucesso: false, retorno: {}, mensagem: '', status_code: null }

      try {
        const { data, error, status } = await supabase
          .from('agendamentos')
          .select(`
            *,
            contatos (*),
            tipos_atendimento (*)
          `)
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
        resultado.mensagem = 'Erro ao carregar agendamento.'
        console.error('[Agendamentos] setAgendamentoByIdAction:', erro)
      }

      if (!obj?.preventState) this.agendamento = resultado.retorno
      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    async postAgendamentoAction(obj) {
      const authStore = useAuthStore()
      const agendamento = obj?.agendamento ?? this.agendamento
      const resultado = { sucesso: false, retorno: null, mensagem: '', status_code: null }

      try {
        const { data, error, status } = await supabase
          .from('agendamentos')
          .insert({
            ...agendamento,
            profissional_id: authStore.profissionalId,
            status: STATUS_AGENDAMENTO.AGENDADO,
          })
          .select(`
            *,
            contatos (id, nome, telefone, email),
            tipos_atendimento (id, nome, duracao_minutos, valor)
          `)
          .single()

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.retorno = data
          resultado.mensagem = 'Agendamento criado!'
          this.lista_agendamentos.push(data)
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao criar agendamento.'
        console.error('[Agendamentos] postAgendamentoAction:', erro)
      }

      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    async putAgendamentoAction(obj) {
      const agendamento = obj?.agendamento ?? this.agendamento
      const resultado = { sucesso: false, retorno: null, mensagem: '', status_code: null }

      try {
        const { data, error, status } = await supabase
          .from('agendamentos')
          .update(agendamento)
          .eq('id', agendamento.id)
          .select(`
            *,
            contatos (id, nome, telefone, email),
            tipos_atendimento (id, nome, duracao_minutos, valor)
          `)
          .single()

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.retorno = data
          resultado.mensagem = 'Agendamento atualizado!'
          const indice = this.lista_agendamentos.findIndex((item) => item.id === data.id)
          if (indice !== -1) this.lista_agendamentos[indice] = data
          this.agendamento = data
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao atualizar agendamento.'
        console.error('[Agendamentos] putAgendamentoAction:', erro)
      }

      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    // Atalho para atualizar apenas o status
    async atualizarStatusAction(obj) {
      return this.putAgendamentoAction({
        agendamento: { id: obj.id, status: obj.status },
        callback: obj?.callback,
      })
    },

    async deleteAgendamentoAction(obj) {
      const agendamento = obj?.agendamento ?? this.agendamento
      const resultado = { sucesso: false, retorno: null, mensagem: '', status_code: null }

      try {
        const { error, status } = await supabase
          .from('agendamentos')
          .delete()
          .eq('id', agendamento.id)

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.mensagem = 'Agendamento removido.'
          this.lista_agendamentos = this.lista_agendamentos.filter(
            (item) => item.id !== agendamento.id,
          )
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao remover agendamento.'
        console.error('[Agendamentos] deleteAgendamentoAction:', erro)
      }

      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    iniciarAgendamentoAction(obj) {
      const agendamento = obj?.agendamento ?? {}
      if (!obj?.preventState) this.agendamento = agendamento
      return agendamento
    },
  },
})
