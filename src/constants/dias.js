// Dias da semana — reexporta do store para manter uma única fonte da verdade.
export { DIAS_SEMANA } from 'src/stores/disponibilidadeStore'

// Subconjunto usado no onboarding (segunda a sábado).
export const DIAS_SEMANA_UTEIS = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

// Labels curtos (Dom/Seg/Ter/...), usado nas grades de agenda.
export const DIAS_LABEL_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
