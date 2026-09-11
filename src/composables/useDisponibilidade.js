import { computed } from 'vue'
import { useDisponibilidadeStore, DIAS_SEMANA } from 'src/stores/disponibilidadeStore'
import { useAgendamentosStore } from 'src/stores/agendamentosStore'
import { STATUS_AGENDAMENTO } from 'src/constants/status'
import dayjs from 'dayjs'

// Fallback quando a disponibilidade do dia não define `duracao_slot`.
const DURACAO_SLOT_PADRAO = 30

export const useDisponibilidade = () => {
  const disponibilidadeStore = useDisponibilidadeStore()
  const agendamentosStore = useAgendamentosStore()

  // Gera os slots de horário disponíveis para uma data específica
  const gerarSlotsDisponiveis = (data) => {
    const diaSemana = dayjs(data).day()
    const disponibilidade = disponibilidadeStore.disponibilidades_por_dia[diaSemana]

    if (!disponibilidade || !disponibilidade.ativo) return []

    const slots = []
    const horaInicio = disponibilidade.hora_inicio
    const horaFim = disponibilidade.hora_fim
    const duracaoSlot = disponibilidade.duracao_slot || DURACAO_SLOT_PADRAO

    const [horaInicioHoras, horaInicioMinutos] = horaInicio.split(':').map(Number)
    const [horaFimHoras, horaFimMinutos] = horaFim.split(':').map(Number)

    let cursor = dayjs(data)
      .hour(horaInicioHoras)
      .minute(horaInicioMinutos)
      .second(0)
      .millisecond(0)

    const fim = dayjs(data).hour(horaFimHoras).minute(horaFimMinutos)

    while (cursor.isBefore(fim)) {
      slots.push(cursor.format('HH:mm'))
      cursor = cursor.add(duracaoSlot, 'minute')
    }

    return slots
  }

  // Filtra slots já ocupados por agendamentos existentes
  const slotsOcupados = computed(() => {
    return agendamentosStore.lista_agendamentos
      .filter((agendamento) =>
        [STATUS_AGENDAMENTO.AGENDADO, STATUS_AGENDAMENTO.CONFIRMADO].includes(agendamento.status),
      )
      .map((agendamento) => agendamento.data_hora?.substring(0, 16))
  })

  const slotEstaDisponivel = (dataHora) => {
    return !slotsOcupados.value.includes(dataHora)
  }

  return {
    disponibilidadeStore,
    gerarSlotsDisponiveis,
    slotsOcupados,
    slotEstaDisponivel,
    DIAS_SEMANA,
  }
}
