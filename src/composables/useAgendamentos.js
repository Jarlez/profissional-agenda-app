import { computed } from 'vue'
import { useAgendamentosStore, STATUS_AGENDAMENTO } from 'src/stores/agendamentosStore'
import { useQuasar } from 'quasar'

export const useAgendamentos = () => {
  const agendamentosStore = useAgendamentosStore()
  const $q = useQuasar()

  const carregarSemana = async (dataInicio, dataFim) => {
    return agendamentosStore.setListAgendamentosAction({
      data_inicio: dataInicio,
      data_fim: dataFim,
    })
  }

  const confirmarAgendamento = async (idAgendamento) => {
    const resultado = await agendamentosStore.atualizarStatusAction({
      id: idAgendamento,
      status: STATUS_AGENDAMENTO.CONFIRMADO,
    })

    $q.notify({
      type: resultado.sucesso ? 'positive' : 'negative',
      message: resultado.sucesso ? 'Agendamento confirmado!' : resultado.mensagem,
    })

    return resultado
  }

  const marcarComoRealizado = async (idAgendamento) => {
    const resultado = await agendamentosStore.atualizarStatusAction({
      id: idAgendamento,
      status: STATUS_AGENDAMENTO.REALIZADO,
    })

    $q.notify({
      type: resultado.sucesso ? 'positive' : 'negative',
      message: resultado.sucesso ? 'Marcado como realizado.' : resultado.mensagem,
    })

    return resultado
  }

  const registrarFalta = async (idAgendamento) => {
    const resultado = await agendamentosStore.atualizarStatusAction({
      id: idAgendamento,
      status: STATUS_AGENDAMENTO.FALTA,
    })

    $q.notify({
      type: resultado.sucesso ? 'warning' : 'negative',
      message: resultado.sucesso ? 'Falta registrada.' : resultado.mensagem,
    })

    return resultado
  }

  const cancelarAgendamento = async (idAgendamento) => {
    const resultado = await agendamentosStore.atualizarStatusAction({
      id: idAgendamento,
      status: STATUS_AGENDAMENTO.CANCELADO,
    })

    $q.notify({
      type: resultado.sucesso ? 'info' : 'negative',
      message: resultado.sucesso ? 'Agendamento cancelado.' : resultado.mensagem,
    })

    return resultado
  }

  // Agrupa agendamentos por hora para a view de agenda
  const agendamentosPorHora = computed(() => {
    const mapa = {}
    agendamentosStore.lista_agendamentos.forEach((agendamento) => {
      if (!agendamento.data_hora) return
      const hora = agendamento.data_hora.substring(11, 16)
      if (!mapa[hora]) mapa[hora] = []
      mapa[hora].push(agendamento)
    })
    return mapa
  })

  return {
    agendamentosStore,
    agendamentosPorHora,
    carregarSemana,
    confirmarAgendamento,
    marcarComoRealizado,
    registrarFalta,
    cancelarAgendamento,
  }
}
