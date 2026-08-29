import { defineStore } from 'pinia'
import { supabase } from 'src/services/supabase'
import { useAuthStore } from './authStore'
import { filtrarPorTexto, ordenarPor } from 'src/utils/helpers'

export const usePacientesStore = defineStore('Pacientes', {
  state: () => ({
    carregando: false,
    configs: {
      orderBy: 'contatos.nome',
      order: 'asc',
      filter_value: '',
      filter_tags: [],
    },
    paciente: {},
    lista_pacientes: [],
  }),

  getters: {
    // Lista com join dos dados do contato para exibição
    lista_pacientes_ordenada: (state) => {
      const lista = filtrarPorTexto(
        state.lista_pacientes,
        state.configs.filter_value,
        ['contatos.nome', 'contatos.telefone', 'contatos.email'],
      )

      if (state.configs.filter_tags.length > 0) {
        return lista.filter((paciente) =>
          state.configs.filter_tags.every((tag) => paciente.tags?.includes(tag)),
        )
      }

      return ordenarPor(lista, 'contatos.nome', state.configs.order)
    },
  },

  actions: {
    // Carrega pacientes com join em contatos
    async setListPacientesAction(obj) {
      const authStore = useAuthStore()
      const resultado = { sucesso: false, retorno: [], mensagem: '', status_code: null }

      if (!authStore.profissionalId) return resultado

      this.carregando = true

      try {
        const { data, error, status } = await supabase
          .from('pacientes')
          .select(`
            *,
            contatos (
              id,
              nome,
              telefone,
              email,
              criado_em
            )
          `)
          .eq('profissional_id', authStore.profissionalId)
          .order('criado_em', { ascending: false })

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.retorno = data
          resultado.mensagem = 'Pacientes carregados.'
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao carregar pacientes.'
        console.error('[Pacientes] setListPacientesAction:', erro)
      }

      this.carregando = false
      if (!obj?.preventState) this.lista_pacientes = resultado.retorno
      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    // Carrega paciente com todos os dados relacionados
    async setPacienteByIdAction(obj) {
      const resultado = { sucesso: false, retorno: {}, mensagem: '', status_code: null }
      this.carregando = true

      try {
        const { data, error, status } = await supabase
          .from('pacientes')
          .select(`
            *,
            contatos (*),
            anexos (*)
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
        resultado.mensagem = 'Erro ao carregar paciente.'
        console.error('[Pacientes] setPacienteByIdAction:', erro)
      }

      this.carregando = false
      if (!obj?.preventState) this.paciente = resultado.retorno
      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    // Cria paciente + contato em transação
    async postPacienteAction(obj) {
      const authStore = useAuthStore()
      const resultado = { sucesso: false, retorno: null, mensagem: '', status_code: null }

      try {
        // 1. Cria o contato base
        const { data: dadosContato, error: erroContato } = await supabase
          .from('contatos')
          .insert({
            profissional_id: authStore.profissionalId,
            nome: obj.nome,
            telefone: obj.telefone ?? null,
            email: obj.email ?? null,
          })
          .select()
          .single()

        if (erroContato) {
          resultado.mensagem = erroContato.message
          if (obj?.callback) obj.callback(resultado)
          return resultado
        }

        // 2. Cria o paciente vinculado ao contato
        const { data: dadosPaciente, error: erroPaciente } = await supabase
          .from('pacientes')
          .insert({
            contato_id: dadosContato.id,
            profissional_id: authStore.profissionalId,
            data_nascimento: obj.data_nascimento ?? null,
            observacoes: obj.observacoes ?? null,
            tags: obj.tags ?? [],
          })
          .select(`*, contatos (*)`)
          .single()

        if (erroPaciente) {
          resultado.mensagem = erroPaciente.message
        } else {
          resultado.sucesso = true
          resultado.retorno = dadosPaciente
          resultado.mensagem = 'Paciente cadastrado com sucesso!'
          this.lista_pacientes.unshift(dadosPaciente)
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao cadastrar paciente.'
        console.error('[Pacientes] postPacienteAction:', erro)
      }

      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    // Atualiza paciente e seu contato
    async putPacienteAction(obj) {
      const paciente = obj?.paciente ?? this.paciente
      const resultado = { sucesso: false, retorno: null, mensagem: '', status_code: null }

      try {
        // Atualiza contato se dados de contato foram passados
        if (obj.dadosContato && paciente.contato_id) {
          const { error: erroContato } = await supabase
            .from('contatos')
            .update(obj.dadosContato)
            .eq('id', paciente.contato_id)

          if (erroContato) {
            resultado.mensagem = erroContato.message
            if (obj?.callback) obj.callback(resultado)
            return resultado
          }
        }

        // Atualiza paciente
        const { data, error, status } = await supabase
          .from('pacientes')
          .update({
            data_nascimento: paciente.data_nascimento,
            observacoes: paciente.observacoes,
            tags: paciente.tags,
          })
          .eq('id', paciente.id)
          .select(`*, contatos (*)`)
          .single()

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.retorno = data
          resultado.mensagem = 'Paciente atualizado!'
          const indice = this.lista_pacientes.findIndex((item) => item.id === data.id)
          if (indice !== -1) this.lista_pacientes[indice] = data
          this.paciente = data
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao atualizar paciente.'
        console.error('[Pacientes] putPacienteAction:', erro)
      }

      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    async deletePacienteAction(obj) {
      const paciente = obj?.paciente ?? this.paciente
      const resultado = { sucesso: false, retorno: null, mensagem: '', status_code: null }

      try {
        const { error, status } = await supabase
          .from('pacientes')
          .delete()
          .eq('id', paciente.id)

        resultado.status_code = status

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.mensagem = 'Paciente removido.'
          this.lista_pacientes = this.lista_pacientes.filter((item) => item.id !== paciente.id)
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao remover paciente.'
        console.error('[Pacientes] deletePacienteAction:', erro)
      }

      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    iniciarPacienteAction(obj) {
      const paciente = obj?.paciente ?? {}
      if (!obj?.preventState) this.paciente = paciente
      return paciente
    },
  },
})
