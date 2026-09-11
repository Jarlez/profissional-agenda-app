// Status possíveis de um agendamento — reexporta o enum do store
// para manter uma única fonte da verdade.
export { STATUS_AGENDAMENTO } from 'src/stores/agendamentosStore'

// Rótulos legíveis usados em badges, listagens e diálogos.
export const STATUS_LABELS = {
  agendado:   'Agendado',
  confirmado: 'Confirmado',
  cancelado:  'Cancelado',
  realizado:  'Realizado',
  falta:      'Falta',
}
