<template>
  <q-page class="fade-in">

    <!-- ─── Cabeçalho ─────────────────────────────────────────── -->
    <div class="page-header">
      <div>
        <div class="t-h1">{{ saudacao }}, {{ authStore.primeiroNome }}.</div>
        <div class="t-small" style="margin-top:4px;">
          {{ dataHojeExtenso }} · {{ agendamentosHoje.length }} atendimento{{ agendamentosHoje.length !== 1 ? 's' : '' }} hoje
        </div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn class="q-px-sm" outline no-caps dense icon="mdi-whatsapp" label="Lembretes" style="border-color:var(--border);color:var(--text);border-radius:var(--radius-sm);" />
        <q-btn class="q-px-sm" unelevated no-caps dense icon="add" label="Novo agendamento" style="background:var(--primary);color:#fff;border-radius:var(--radius-sm);" @click="$router.push({ name: 'agenda' })" />
      </div>
    </div>

    <div style="padding:0 32px 32px;">

      <!-- ─── Card link público ─────────────────────────────── -->
      <div class="atende-card" style="padding:14px 18px;display:flex;align-items:center;gap:14px;margin-bottom:20px;">
        <div style="width:34px;height:34px;border-radius:8px;background:var(--primary-soft);color:var(--primary-text);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <q-icon name="link" size="16px"/>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;color:var(--text-3);margin-bottom:2px;">Seu link de agendamento</div>
          <div style="font-size:13.5px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            atende.app/{{ authStore.slugProfissional || '…' }}
          </div>
        </div>
        <q-btn
          class="q-px-sm"
          flat no-caps dense
          :icon="linkCopiado ? 'check' : 'content_copy'"
          :label="linkCopiado ? 'Copiado!' : 'Copiar'"
          :style="linkCopiado ? 'color:var(--status-confirmado);' : 'color:var(--text-2);'"
          style="border-radius:var(--radius-sm);"
          @click="copiarLink"
        />
        <q-btn
          class="q-px-sm"
          flat no-caps dense
          icon="open_in_new"
          label="Abrir"
          style="color:var(--text-2);border-radius:var(--radius-sm);"
          :href="`/agendar/${authStore.slugProfissional}`"
          target="_blank"
        />
      </div>

      <!-- ─── KPIs ───────────────────────────────────────────── -->
      <div v-if="carregando" class="row q-gutter-sm q-mb-lg">
        <div v-for="n in 4" :key="n" class="col atende-card" style="min-height:120px;">
          <q-skeleton type="rect" height="120px" />
        </div>
      </div>

      <div v-else class="row q-gutter-sm q-mb-lg">
        <div class="col atende-card" style="padding:16px;display:flex;flex-direction:column;gap:12px;min-height:120px;">
          <div class="row items-center justify-between">
            <div class="row items-center q-gutter-xs" style="color:var(--text-2);">
              <span style="width:26px;height:26px;border-radius:7px;background:var(--card-2);border:1px solid var(--border);display:inline-flex;align-items:center;justify-content:center;">
                <q-icon name="calendar_month" size="14px" />
              </span>
              <span style="font-size:12.5px;font-weight:500;">Agendamentos</span>
            </div>
            <span class="t-num" style="font-size:12px;font-weight:500;color:var(--status-confirmado);">este mês</span>
          </div>
          <div class="t-num" style="font-size:30px;font-weight:600;letter-spacing:-0.02em;line-height:1;color:var(--text);">{{ kpis.totalMes }}</div>
          <div class="t-small">mês atual</div>
        </div>

        <div class="col atende-card" style="padding:16px;display:flex;flex-direction:column;gap:12px;min-height:120px;">
          <div class="row items-center justify-between">
            <div class="row items-center q-gutter-xs" style="color:var(--text-2);">
              <span style="width:26px;height:26px;border-radius:7px;background:var(--card-2);border:1px solid var(--border);display:inline-flex;align-items:center;justify-content:center;">
                <q-icon name="event_busy" size="14px" />
              </span>
              <span style="font-size:12.5px;font-weight:500;">Faltas</span>
            </div>
            <span class="t-num" style="font-size:12px;font-weight:500;color:var(--status-falta);">este mês</span>
          </div>
          <div class="t-num" style="font-size:30px;font-weight:600;letter-spacing:-0.02em;line-height:1;color:var(--text);">{{ kpis.faltas }}</div>
          <div class="t-small">taxa {{ taxaFalta }}%</div>
        </div>

        <div class="col atende-card" style="padding:16px;display:flex;flex-direction:column;gap:12px;min-height:120px;">
          <div class="row items-center justify-between">
            <div class="row items-center q-gutter-xs" style="color:var(--text-2);">
              <span style="width:26px;height:26px;border-radius:7px;background:var(--card-2);border:1px solid var(--border);display:inline-flex;align-items:center;justify-content:center;">
                <q-icon name="group" size="14px" />
              </span>
              <span style="font-size:12.5px;font-weight:500;">Pacientes</span>
            </div>
          </div>
          <div class="t-num" style="font-size:30px;font-weight:600;letter-spacing:-0.02em;line-height:1;color:var(--text);">{{ kpis.pacientes }}</div>
          <div class="t-small">cadastrados</div>
        </div>

        <div class="col atende-card" style="padding:16px;display:flex;flex-direction:column;gap:12px;min-height:120px;">
          <div class="row items-center justify-between">
            <div class="row items-center q-gutter-xs" style="color:var(--text-2);">
              <span style="width:26px;height:26px;border-radius:7px;background:var(--card-2);border:1px solid var(--border);display:inline-flex;align-items:center;justify-content:center;">
                <q-icon name="check_circle_outline" size="14px" />
              </span>
              <span style="font-size:12.5px;font-weight:500;">Realizados</span>
            </div>
          </div>
          <div class="t-num" style="font-size:30px;font-weight:600;letter-spacing:-0.02em;line-height:1;color:var(--text);">{{ kpis.realizados }}</div>
          <div class="t-small">este mês</div>
        </div>
      </div>

      <!-- ─── Grid principal ─────────────────────────────────── -->
      <div class="row q-gutter-md">

        <!-- Lista de hoje -->
        <div class="col-8">
          <div class="atende-card">
            <div style="padding:14px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);">
              <div>
                <div class="t-h3" style="margin-bottom:2px;">Próximos atendimentos hoje</div>
                <div class="t-small">{{ agendamentosHoje.length }} sessões agendadas</div>
              </div>
              <div v-if="proximoAtendimento" style="font-size:12px;color:var(--primary);font-weight:500;background:var(--primary-soft);padding:4px 10px;border-radius:20px;">
                próximo em {{ countdownProximo }}
              </div>
            </div>

            <!-- Skeleton -->
            <div v-if="carregando">
              <div v-for="n in 4" :key="n" style="padding:14px 18px;border-bottom:1px solid var(--border);">
                <q-skeleton type="text" />
              </div>
            </div>

            <!-- Empty state novo usuário -->
            <div v-else-if="!agendamentosHoje.length && kpis.totalMes === 0" style="padding:48px 24px;text-align:center;">
              <q-icon name="event_available" size="48px" style="color:var(--text-3);" />
              <div class="t-h3" style="margin-top:12px;color:var(--text);">Nenhum agendamento ainda</div>
              <div class="t-small" style="margin-top:4px;">Compartilhe seu link e receba o primeiro agendamento.</div>
              <q-btn
                class="q-px-sm"
                unelevated no-caps
                icon="content_copy"
                label="Copiar link público"
                style="background:var(--primary);color:#fff;border-radius:var(--radius-sm);margin-top:16px;"
                @click="copiarLink"
              />
            </div>

            <!-- Vazio hoje (mas tem histórico) -->
            <div v-else-if="!agendamentosHoje.length" style="padding:48px 24px;text-align:center;">
              <q-icon name="event_available" size="48px" style="color:var(--text-3);" />
              <div class="t-h3" style="margin-top:12px;color:var(--text);">Nenhum atendimento hoje</div>
              <div class="t-small">Sua agenda está livre.</div>
            </div>

            <!-- Lista -->
            <div v-else>
              <div
                v-for="(ag, i) in agendamentosHoje"
                :key="ag.id"
                class="row-hover cursor-pointer"
                style="display:grid;grid-template-columns:64px 28px 1fr auto auto;align-items:center;gap:14px;padding:12px 18px;"
                :style="i < agendamentosHoje.length - 1 ? 'border-bottom:1px solid var(--border);' : ''"
                @click="$router.push({ name: 'paciente-detalhe', params: { id: ag.paciente_id || ag.contato_id } })"
              >
                <div style="display:flex;flex-direction:column;align-items:flex-start;">
                  <span class="t-num" style="font-size:13.5px;font-weight:500;color:var(--text);">{{ formatarHora(ag.data_hora) }}</span>
                  <span v-if="countdownItem(ag)" class="t-num" style="font-size:11px;color:var(--primary);">{{ countdownItem(ag) }}</span>
                </div>
                <span class="av" style="width:26px;height:26px;font-size:10px;">{{ iniciais(ag.contatos?.nome || ag.contato?.nome || '') }}</span>
                <div style="min-width:0;">
                  <div style="font-size:13.5px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text);">
                    {{ ag.contatos?.nome || ag.contato?.nome || 'Paciente' }}
                  </div>
                  <div class="t-small" style="font-size:12px;">
                    {{ ag.tipos_atendimento?.nome || ag.tipo_atendimento?.nome || 'Atendimento' }} · {{ ag.duracao_minutos }} min
                  </div>
                </div>
                <span class="badge" :class="`badge-${ag.status}`">
                  <span class="dot"></span>{{ STATUS_LABELS[ag.status] }}
                </span>
                <q-icon name="chevron_right" size="14px" style="color:var(--text-3);" />
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna lateral -->
        <div class="col" style="display:flex;flex-direction:column;gap:16px;">

          <!-- Gráfico de semana -->
          <div class="atende-card" style="padding:18px;">
            <div class="row items-start justify-between q-mb-md">
              <div>
                <div class="t-h3" style="margin-bottom:2px;">Agendamentos da semana</div>
                <div class="t-small">{{ totalSemana }} total</div>
              </div>
            </div>
            <div style="display:flex;align-items:flex-end;gap:10px;height:120px;padding-top:8px;">
              <div
                v-for="dia in chartSemana"
                :key="dia.dia"
                class="bar-item"
              >
                <span class="t-num" style="font-size:11.5px;color:var(--text-3);">{{ dia.total }}</span>
                <div
                  style="width:100%;max-width:40px;border-radius:4px;transition:height 240ms ease;"
                  :style="{
                    height: maxChart ? `${(dia.total / maxChart) * 72}px` : '4px',
                    background: dia.hoje ? 'var(--primary)' : 'var(--card-2)',
                    border: dia.hoje ? 'none' : '1px solid var(--border)',
                    minHeight: '4px',
                  }"
                ></div>
                <span style="font-size:11.5px;" :style="{ color: dia.hoje ? 'var(--text)' : 'var(--text-2)', fontWeight: dia.hoje ? 500 : 400 }">{{ dia.label }}</span>
              </div>
            </div>
          </div>

          <!-- Acesso rápido -->
          <div class="atende-card" style="padding:18px;">
            <div class="t-h3 q-mb-sm">Acesso rápido</div>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <button
                v-for="acao in acoesRapidas"
                :key="acao.label"
                class="row-hover"
                style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:0;background:transparent;border-radius:var(--radius-sm);cursor:pointer;text-align:left;font-family:inherit;width:100%;"
                @click="acao.fn"
              >
                <q-icon :name="acao.icone" size="15px" style="color:var(--text-2);" />
                <span style="font-size:13.5px;flex:1;color:var(--text);">{{ acao.label }}</span>
                <span v-if="acao.hint" class="t-num" style="font-size:11px;color:var(--text-3);">{{ acao.hint }}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { useAuthStore }         from 'src/stores/authStore'
import { useAgendamentosStore } from 'src/stores/agendamentosStore'
import { usePacientesStore }    from 'src/stores/pacientesStore'
import { formatarHora, formatarDataExtenso } from 'src/utils/helpers'
import { STATUS_LABELS, STATUS_AGENDAMENTO } from 'src/constants/status'

const router = useRouter()
const authStore         = useAuthStore()
const agendamentosStore = useAgendamentosStore()
const pacientesStore    = usePacientesStore()

const linkCopiado = ref(false)

const DIAS_CHART = [
  { dow: 1, label: 'Seg' },
  { dow: 2, label: 'Ter' },
  { dow: 3, label: 'Qua' },
  { dow: 4, label: 'Qui' },
  { dow: 5, label: 'Sex' },
  { dow: 6, label: 'Sáb' },
]

const carregando       = computed(() => agendamentosStore.carregando)
const agendamentosHoje = computed(() => agendamentosStore.agendamentos_hoje)

const saudacao = computed(() => {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
})

const dataHojeExtenso = computed(() => formatarDataExtenso(new Date()))

const kpis = computed(() => {
  const lista = agendamentosStore.lista_agendamentos
  return {
    totalMes:   lista.length,
    faltas:     lista.filter(a => a.status === STATUS_AGENDAMENTO.FALTA).length,
    realizados: lista.filter(a => a.status === STATUS_AGENDAMENTO.REALIZADO).length,
    pacientes:  pacientesStore.lista_pacientes.length,
  }
})

const taxaFalta = computed(() => {
  if (!kpis.value.totalMes) return 0
  return ((kpis.value.faltas / kpis.value.totalMes) * 100).toFixed(1)
})

const chartSemana = computed(() => {
  const hoje         = dayjs()
  const inicioSemana = hoje.startOf('week')
  const lista        = agendamentosStore.lista_agendamentos
  return DIAS_CHART.map(dia => {
    const data  = inicioSemana.add(dia.dow, 'day')
    const total = lista.filter(a => dayjs(a.data_hora).isSame(data, 'day')).length
    return { ...dia, total, hoje: data.isSame(hoje, 'day') }
  })
})

const maxChart    = computed(() => Math.max(...chartSemana.value.map(d => d.total), 1))
const totalSemana = computed(() => chartSemana.value.reduce((s, d) => s + d.total, 0))

// ─── Próximo atendimento e countdown ─────────────────────────────────────
const agora = ref(dayjs())
let timerAgora = null

const proximoAtendimento = computed(() => {
  return agendamentosHoje.value
    .filter(a => [STATUS_AGENDAMENTO.AGENDADO, STATUS_AGENDAMENTO.CONFIRMADO].includes(a.status) && dayjs(a.data_hora).isAfter(agora.value))
    .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora))[0] || null
})

const countdownProximo = computed(() => {
  if (!proximoAtendimento.value) return ''
  return formatarCountdown(dayjs(proximoAtendimento.value.data_hora).diff(agora.value, 'minute'))
})

const countdownItem = (ag) => {
  if (![STATUS_AGENDAMENTO.AGENDADO, STATUS_AGENDAMENTO.CONFIRMADO].includes(ag.status)) return ''
  const diff = dayjs(ag.data_hora).diff(agora.value, 'minute')
  if (diff < 0 || diff > 120) return ''
  return `em ${formatarCountdown(diff)}`
}

const formatarCountdown = (minutos) => {
  if (minutos <= 0) return 'agora'
  if (minutos < 60) return `${minutos} min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

const acoesRapidas = [
  { icone: 'add',        label: 'Novo agendamento',   fn: () => router.push({ name: 'agenda' }) },
  { icone: 'person_add', label: 'Adicionar paciente',  fn: () => router.push({ name: 'pacientes' }) },
  { icone: 'event_busy', label: 'Bloquear horário',    fn: () => router.push({ name: 'configuracoes' }) },
]

const iniciais = (nome) =>
  (nome || '?').split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()

const copiarLink = () => {
  const link = `atende.app/${authStore.slugProfissional || ''}`
  navigator.clipboard.writeText(link).then(() => {
    linkCopiado.value = true
    setTimeout(() => { linkCopiado.value = false }, 2500)
  })
}

watch(() => authStore.profissionalId, async (id) => {
  if (!id) return
  const inicio = dayjs().startOf('month').toISOString()
  const fim    = dayjs().endOf('month').toISOString()
  await Promise.all([
    agendamentosStore.setListAgendamentosAction({ data_inicio: inicio, data_fim: fim }),
    pacientesStore.setListPacientesAction(),
  ])

  timerAgora = setInterval(() => { agora.value = dayjs() }, 30_000)
}, { immediate: true })
</script>
