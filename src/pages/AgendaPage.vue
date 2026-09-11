<template>
  <q-page class="fade-in">

    <!-- ─── Cabeçalho ─────────────────────────────────────────── -->
    <div class="page-header">
      <div>
        <div class="t-h1">Agenda</div>
        <div class="t-small" style="margin-top:4px;">{{ modoVista === 'dia' ? subtituloDia : subtituloSemana }}</div>
      </div>
      <div class="row q-gutter-sm items-center">
        <div class="seg">
          <button :class="{ active: modoVista === 'semana' }" @click="modoVista = 'semana'">Semana</button>
          <button :class="{ active: modoVista === 'dia' }" @click="modoVista = 'dia'">Dia</button>
        </div>
        <q-btn class="q-px-sm" unelevated no-caps dense icon="add" label="Novo agendamento" style="background:var(--primary);color:#fff;border-radius:var(--radius-sm);" @click="abrirNovoAgendamento()" />
      </div>
    </div>

    <div style="padding:0 32px 32px;display:grid;grid-template-columns:1fr 256px;gap:18px;align-items:start;">

      <!-- ─── Grid semanal ─────────────────────────────────────── -->
      <div v-if="modoVista === 'semana'" class="atende-card" style="overflow:hidden;">

        <!-- Toolbar -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid var(--border);">
          <div style="display:flex;align-items:center;gap:6px;">
            <q-btn class="q-px-sm" flat no-caps dense size="sm" icon="chevron_left" style="border:1px solid var(--border);border-radius:var(--radius-sm);" @click="semanaOffset--" />
            <q-btn class="q-px-sm" flat no-caps dense size="sm" label="Hoje" style="border:1px solid var(--border);border-radius:var(--radius-sm);" @click="semanaOffset = 0" />
            <q-btn class="q-px-sm" flat no-caps dense size="sm" icon="chevron_right" style="border:1px solid var(--border);border-radius:var(--radius-sm);" @click="semanaOffset++" />
            <span style="margin-left:8px;font-size:13.5px;font-weight:500;color:var(--text);">{{ mesSemana }}</span>
          </div>
          <div style="display:flex;gap:12px;font-size:11.5px;color:var(--text-2);">
            <span v-for="tipo in tiposAtendimento.slice(0,4)" :key="tipo.id" style="display:inline-flex;align-items:center;gap:5px;">
              <i :style="`width:8px;height:8px;border-radius:2px;background:${tipo.cor || 'var(--primary)'};`"></i>
              {{ tipo.nome }}
            </span>
          </div>
        </div>

        <!-- Cabeçalho de dias -->
        <div :style="`display:grid;grid-template-columns:56px repeat(${diasSemana.length},1fr);border-bottom:1px solid var(--border);`">
          <div style="padding:10px 8px;border-right:1px solid var(--border);"></div>
          <div v-for="dia in diasSemana" :key="dia.key" style="padding:10px 10px;border-right:1px solid var(--border);">
            <div class="t-tiny">{{ dia.label }}</div>
            <div class="t-num" style="margin-top:2px;font-size:16px;font-weight:500;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:6px;"
              :style="dia.hoje ? 'background:var(--primary);color:#fff;' : 'color:var(--text);'"
            >{{ dia.data }}</div>
          </div>
        </div>

        <!-- Empty state semana -->
        <div v-if="!agendamentosNaSemana.length" style="padding:48px 24px;text-align:center;border-top:1px solid var(--border);">
          <q-icon name="calendar_today" size="40px" style="color:var(--text-3);" />
          <div class="t-h3" style="margin-top:12px;color:var(--text);">Nenhum agendamento esta semana</div>
          <div class="t-small">Clique em qualquer horário para criar um agendamento.</div>
          <q-btn class="q-px-sm" unelevated no-caps icon="add" label="Novo agendamento" style="background:var(--primary);color:#fff;border-radius:var(--radius-sm);margin-top:16px;" @click="abrirNovoAgendamento()" />
        </div>

        <!-- Linhas de horário -->
        <div v-else style="overflow-y:auto;max-height:calc(100vh - 260px);">
          <div
            v-for="(hora, hi) in HORAS" :key="hora"
            :style="`display:grid;grid-template-columns:56px repeat(${diasSemana.length},1fr);min-height:60px;` + (hi < HORAS.length - 1 ? 'border-bottom:1px solid var(--border);' : '')"
          >
            <div style="padding:6px 8px;border-right:1px solid var(--border);font-size:11.5px;color:var(--text-3);font-variant-numeric:tabular-nums;white-space:nowrap;">
              {{ hora }}
            </div>
            <div
              v-for="dia in diasSemana" :key="dia.key"
              style="padding:3px;border-right:1px solid var(--border);position:relative;cursor:pointer;"
              :style="dia.hoje ? 'background:rgba(139,118,245,0.04);' : ''"
              @click="abrirNovoAgendamento(dia.dataCompleta, hora)"
            >
              <div
                v-if="agendamentoNaCelula(dia.key, hora)"
                :key="agendamentoNaCelula(dia.key, hora).id"
                style="position:absolute;inset:3px;border-radius:var(--radius-sm);padding:5px 7px;display:flex;flex-direction:column;gap:1px;cursor:pointer;overflow:hidden;"
                :style="estiloAgendamento(agendamentoNaCelula(dia.key, hora))"
                @click.stop="verAgendamento(agendamentoNaCelula(dia.key, hora))"
              >
                <div style="font-size:11.5px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                  :style="agendamentoNaCelula(dia.key, hora).status === STATUS_AGENDAMENTO.REALIZADO ? 'text-decoration:line-through;opacity:0.7;' : ''"
                >
                  {{ agendamentoNaCelula(dia.key, hora).contatos?.nome || 'Paciente' }}
                </div>
                <div style="font-size:10.5px;opacity:0.8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                  {{ agendamentoNaCelula(dia.key, hora).tipos_atendimento?.nome || '' }}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ─── Vista do dia ──────────────────────────────────────── -->
      <div v-else class="atende-card" style="overflow:hidden;">

        <!-- Toolbar dia -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid var(--border);">
          <div style="display:flex;align-items:center;gap:6px;">
            <q-btn class="q-px-sm" flat no-caps dense size="sm" icon="chevron_left" style="border:1px solid var(--border);border-radius:var(--radius-sm);" @click="diaAnterior" />
            <q-btn class="q-px-sm" flat no-caps dense size="sm" label="Hoje" style="border:1px solid var(--border);border-radius:var(--radius-sm);" @click="diaAtualStr = diaHoje" />
            <q-btn class="q-px-sm" flat no-caps dense size="sm" icon="chevron_right" style="border:1px solid var(--border);border-radius:var(--radius-sm);" @click="diaProximo" />
          </div>
          <div style="display:flex;gap:12px;font-size:11.5px;color:var(--text-2);">
            <span v-for="tipo in tiposAtendimento.slice(0,4)" :key="tipo.id" style="display:inline-flex;align-items:center;gap:5px;">
              <i :style="`width:8px;height:8px;border-radius:2px;background:${tipo.cor || 'var(--primary)'};`"></i>
              {{ tipo.nome }}
            </span>
          </div>
        </div>

        <!-- Cabeçalho do dia -->
        <div style="display:grid;grid-template-columns:56px 1fr;border-bottom:1px solid var(--border);">
          <div style="padding:10px 8px;border-right:1px solid var(--border);"></div>
          <div style="padding:10px 14px;">
            <div class="t-tiny">{{ diaDaSemanaLabel }}</div>
            <div class="t-num" style="margin-top:2px;font-size:18px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;"
              :style="diaAtualStr === diaHoje ? 'background:var(--primary);color:#fff;' : 'color:var(--text);'"
            >{{ diaNumero }}</div>
          </div>
        </div>

        <!-- Empty state dia -->
        <div v-if="!agendamentosNoDia.length" style="padding:48px 24px;text-align:center;">
          <q-icon name="event_available" size="40px" style="color:var(--text-3);" />
          <div class="t-h3" style="margin-top:12px;color:var(--text);">Nenhum atendimento neste dia</div>
          <div class="t-small">Clique em um horário para agendar.</div>
        </div>

        <!-- Linhas de horário do dia -->
        <div v-else style="overflow-y:auto;max-height:calc(100vh - 260px);">
          <div
            v-for="(hora, hi) in HORAS" :key="hora"
            style="display:grid;grid-template-columns:56px 1fr;min-height:60px;"
            :style="hi < HORAS.length - 1 ? 'border-bottom:1px solid var(--border);' : ''"
          >
            <div style="padding:6px 8px;border-right:1px solid var(--border);font-size:11.5px;color:var(--text-3);font-variant-numeric:tabular-nums;white-space:nowrap;">
              {{ hora }}
            </div>
            <div
              style="padding:3px;position:relative;cursor:pointer;"
              :style="diaAtualStr === diaHoje ? 'background:rgba(139,118,245,0.04);' : ''"
              @click="abrirNovoAgendamento(diaAtualStr, hora)"
            >
              <div
                v-if="agendamentoNaCelulaDia(hora)"
                :key="agendamentoNaCelulaDia(hora).id"
                style="position:absolute;inset:3px;border-radius:var(--radius-sm);padding:6px 10px;display:flex;flex-direction:column;gap:2px;cursor:pointer;overflow:hidden;"
                :style="estiloAgendamento(agendamentoNaCelulaDia(hora))"
                @click.stop="verAgendamento(agendamentoNaCelulaDia(hora))"
              >
                <div style="font-size:12.5px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                  :style="agendamentoNaCelulaDia(hora).status === STATUS_AGENDAMENTO.REALIZADO ? 'text-decoration:line-through;opacity:0.7;' : ''"
                >
                  {{ agendamentoNaCelulaDia(hora).contatos?.nome || 'Paciente' }}
                </div>
                <div style="font-size:11px;opacity:0.8;">
                  {{ agendamentoNaCelulaDia(hora).tipos_atendimento?.nome || '' }}
                  <span v-if="agendamentoNaCelulaDia(hora).duracao_minutos"> · {{ agendamentoNaCelulaDia(hora).duracao_minutos }} min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ─── Painel lateral ────────────────────────────────────── -->
      <div style="display:flex;flex-direction:column;gap:14px;">

        <!-- Mini calendário -->
        <div class="atende-card" style="padding:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <span style="font-size:13px;font-weight:500;color:var(--text);">{{ mesMiniCal }}</span>
            <div style="display:flex;gap:2px;">
              <q-btn class="q-px-sm" flat dense round size="xs" icon="chevron_left" @click="miniCalOffset--" />
              <q-btn class="q-px-sm" flat dense round size="xs" icon="chevron_right" @click="miniCalOffset++" />
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;font-size:11px;">
            <div v-for="d in ['D','S','T','Q','Q','S','S']" :key="d" style="text-align:center;color:var(--text-3);padding:4px 0;font-weight:500;">{{ d }}</div>
            <div
              v-for="(dia, i) in diasMiniCal" :key="i"
              style="height:26px;display:flex;align-items:center;justify-content:center;border-radius:6px;cursor:pointer;font-size:12px;font-variant-numeric:tabular-nums;"
              :style="estiloMiniCalDia(dia)"
              @click="dia && irParaDia(dia)"
            >{{ dia }}</div>
          </div>
        </div>

        <!-- Resumo da semana -->
        <div class="atende-card" style="padding:14px;">
          <div class="t-tiny" style="margin-bottom:10px;">Resumo da semana</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div v-for="stat in resumoSemana" :key="stat.label" style="display:flex;justify-content:space-between;font-size:13px;">
              <span style="color:var(--text-2);">{{ stat.label }}</span>
              <span class="t-num" style="font-weight:500;color:var(--text);">{{ stat.valor }}</span>
            </div>
          </div>
        </div>

        <!-- Tipos de atendimento -->
        <div v-if="tiposAtendimento.length" class="atende-card" style="padding:14px;">
          <div class="t-tiny" style="margin-bottom:10px;">Tipos de atendimento</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div v-for="tipo in tiposAtendimento" :key="tipo.id" style="display:flex;align-items:center;justify-content:space-between;font-size:13px;">
              <span style="display:inline-flex;align-items:center;gap:8px;">
                <i :style="`width:8px;height:8px;border-radius:2px;background:${tipo.cor || 'var(--primary)'};`"></i>
                <span style="color:var(--text);">{{ tipo.nome }}</span>
              </span>
              <span class="t-num" style="color:var(--text-2);font-size:12px;">{{ tipo.duracao_minutos }} min</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ─── Modal novo agendamento ────────────────────────────── -->
    <q-dialog v-model="modalAberto" persistent>
      <q-card style="width:520px;max-width:calc(100vw - 32px);background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);">
        <q-card-section style="padding:20px 24px 0;">
          <div class="t-h2">Novo agendamento</div>
        </q-card-section>
        <q-card-section style="padding:16px 24px;display:flex;flex-direction:column;gap:14px;">
          <div>
            <div class="t-small" style="margin-bottom:6px;font-weight:500;">Paciente *</div>
            <q-select
              v-model="novoAg.contato_id"
              :options="opcoesPacientes"
              option-value="value" option-label="label"
              emit-value map-options dense outlined
              use-input hide-selected fill-input input-debounce="200"
              placeholder="Buscar paciente…"
              @filter="filtrarPacientes"
            />
          </div>
          <div>
            <div class="t-small" style="margin-bottom:6px;font-weight:500;">Tipo de atendimento</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
              <div
                v-for="tipo in tiposAtendimento" :key="tipo.id"
                style="padding:10px 12px;border-radius:var(--radius-sm);border:1px solid var(--border);cursor:pointer;text-align:left;transition:all 120ms;"
                :style="novoAg.tipo_atendimento_id === tipo.id ? `border-color:${tipo.cor || 'var(--primary)'};background:var(--primary-soft);` : 'background:var(--card-2);'"
                @click="novoAg.tipo_atendimento_id = tipo.id; novoAg.duracao_minutos = tipo.duracao_minutos"
              >
                <div style="font-size:13px;font-weight:500;color:var(--text);">{{ tipo.nome }}</div>
                <div class="t-small" style="font-size:11.5px;">{{ tipo.duracao_minutos }} min</div>
              </div>
            </div>
          </div>
          <div class="row q-gutter-sm">
            <div class="col">
              <div class="t-small" style="margin-bottom:6px;font-weight:500;">Data *</div>
              <q-input v-model="novoAg.data" dense outlined type="date" />
            </div>
            <div class="col">
              <div class="t-small" style="margin-bottom:6px;font-weight:500;">Horário *</div>
              <q-input v-model="novoAg.hora" dense outlined type="time" />
            </div>
            <div class="col">
              <div class="t-small" style="margin-bottom:6px;font-weight:500;">Duração (min)</div>
              <q-input v-model.number="novoAg.duracao_minutos" dense outlined type="number" min="10" max="240" step="10" />
            </div>
          </div>
          <div>
            <div class="t-small" style="margin-bottom:6px;font-weight:500;">Observações</div>
            <q-input v-model="novoAg.notas" dense outlined type="textarea" :rows="2" placeholder="Observações sobre o atendimento…" />
          </div>
        </q-card-section>
        <q-card-actions align="right" style="padding:12px 24px 20px;gap:8px;">
          <q-btn class="q-px-sm" flat no-caps label="Cancelar" style="color:var(--text-2);" @click="fecharModal" />
          <q-btn class="q-px-sm" unelevated no-caps label="Criar agendamento" :loading="salvando" style="background:var(--primary);color:#fff;border-radius:var(--radius-sm);" @click="criarAgendamento" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ─── Modal detalhe agendamento ──────────────────────────── -->
    <q-dialog v-model="modalDetalheAberto">
      <q-card v-if="agendamentoSelecionado" style="width:420px;max-width:calc(100vw - 32px);background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);">
        <q-card-section style="padding:20px 24px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <span class="av" style="width:40px;height:40px;font-size:15px;">{{ iniciais(agendamentoSelecionado.contatos?.nome || '') }}</span>
            <div>
              <div style="font-size:15px;font-weight:600;color:var(--text);">{{ agendamentoSelecionado.contatos?.nome || 'Paciente' }}</div>
              <span class="badge" :class="`badge-${agendamentoSelecionado.status}`">
                <span class="dot"></span>{{ STATUS_LABELS[agendamentoSelecionado.status] }}
              </span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;color:var(--text-2);">
            <span><strong style="color:var(--text);">Tipo:</strong> {{ agendamentoSelecionado.tipos_atendimento?.nome || '—' }}</span>
            <span><strong style="color:var(--text);">Data:</strong> {{ formatarDataHora(agendamentoSelecionado.data_hora) }}</span>
            <span><strong style="color:var(--text);">Duração:</strong> {{ agendamentoSelecionado.duracao_minutos }} min</span>
            <span v-if="agendamentoSelecionado.notas"><strong style="color:var(--text);">Notas:</strong> {{ agendamentoSelecionado.notas }}</span>
          </div>

          <!-- Ações de status -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;">
            <q-btn class="q-px-sm" v-if="agendamentoSelecionado.status === STATUS_AGENDAMENTO.AGENDADO" flat no-caps dense size="sm" label="Confirmar" style="color:var(--status-confirmado);border:1px solid var(--status-confirmado);border-radius:var(--radius-sm);" @click="mudarStatus(STATUS_AGENDAMENTO.CONFIRMADO)" />
            <q-btn class="q-px-sm" v-if="[STATUS_AGENDAMENTO.AGENDADO, STATUS_AGENDAMENTO.CONFIRMADO].includes(agendamentoSelecionado.status)" flat no-caps dense size="sm" label="Realizado" style="color:var(--status-realizado);border:1px solid var(--status-realizado);border-radius:var(--radius-sm);" @click="iniciarRealizado" />
            <q-btn class="q-px-sm" v-if="[STATUS_AGENDAMENTO.AGENDADO, STATUS_AGENDAMENTO.CONFIRMADO].includes(agendamentoSelecionado.status)" flat no-caps dense size="sm" label="Falta" style="color:var(--status-falta);border:1px solid var(--status-falta);border-radius:var(--radius-sm);" @click="mudarStatus(STATUS_AGENDAMENTO.FALTA)" />
            <q-btn class="q-px-sm" flat no-caps dense size="sm" label="Cancelar" style="color:var(--text-2);border:1px solid var(--border);border-radius:var(--radius-sm);" @click="mudarStatus(STATUS_AGENDAMENTO.CANCELADO)" />
          </div>

          <!-- Nota rápida pós-sessão -->
          <div v-if="aguardandoNota" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);">
            <div style="font-size:13px;font-weight:500;color:var(--text);margin-bottom:8px;">Nota rápida da sessão <span class="t-small">(opcional)</span></div>
            <q-input
              v-model="notaRapida"
              dense outlined type="textarea" :rows="3"
              placeholder="Evolução, observações, próximos passos…"
              autofocus
            />
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">
              <q-btn class="q-px-sm" flat no-caps dense label="Pular" style="color:var(--text-2);" @click="salvarRealizado(false)" />
              <q-btn class="q-px-sm" unelevated no-caps dense label="Salvar nota" :loading="salvandoNota" style="background:var(--primary);color:#fff;border-radius:var(--radius-sm);" @click="salvarRealizado(true)" />
            </div>
          </div>
        </q-card-section>

        <q-card-actions v-if="!aguardandoNota" align="right" style="padding:0 24px 16px;">
          <q-btn class="q-px-sm" flat no-caps label="Fechar" style="color:var(--text-2);" @click="modalDetalheAberto = false" />
          <q-btn class="q-px-sm" flat no-caps label="Ver paciente" style="color:var(--primary);" @click="$router.push({ name: 'paciente-detalhe', params: { id: agendamentoSelecionado.paciente_id || agendamentoSelecionado.contato_id } }); modalDetalheAberto = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { useAuthStore }            from 'src/stores/authStore'
import { useAgendamentosStore }    from 'src/stores/agendamentosStore'
import { useDisponibilidadeStore } from 'src/stores/disponibilidadeStore'
import { usePacientesStore }       from 'src/stores/pacientesStore'
import { formatarDataHora }        from 'src/utils/helpers'
import { STATUS_LABELS, STATUS_AGENDAMENTO } from 'src/constants/status'
import { DIAS_LABEL_CURTO }        from 'src/constants/dias'

dayjs.locale('pt-br')

const $q                  = useQuasar()
const router              = useRouter()
const authStore            = useAuthStore()
const agendamentosStore    = useAgendamentosStore()
const disponibilidadeStore = useDisponibilidadeStore()
const pacientesStore       = usePacientesStore()

// TODO(agenda-horas): hoje a grade da agenda é fixa 07h-19h. Idealmente derivar do
// menor `hora_inicio` e maior `hora_fim` das disponibilidades ativas do profissional
// (disponibilidadeStore.lista_disponibilidades), para não cortar quem trabalha à noite
// ou muito cedo.
const HORAS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00']

const COR_POR_POSICAO = ['var(--primary)','#8B5CF6','#A78BFA','#6E56CF','#10B981','#3B82F6']

const diaHoje       = dayjs().format('YYYY-MM-DD')
const semanaOffset  = ref(0)
const miniCalOffset = ref(0)
const modoVista     = ref('semana')
const diaAtualStr   = ref(diaHoje)

const modalAberto         = ref(false)
const modalDetalheAberto  = ref(false)
const salvando            = ref(false)
const agendamentoSelecionado = ref(null)
const pacientesFiltrados  = ref([])

// ─── Nota rápida pós-sessão ──────────────────────────────────────────────
const aguardandoNota = ref(false)
const notaRapida     = ref('')
const salvandoNota   = ref(false)

const novoAgVazio = () => ({
  contato_id: null,
  tipo_atendimento_id: null,
  data: dayjs().format('YYYY-MM-DD'),
  hora: '08:00',
  duracao_minutos: 60,
  notas: '',
})
const novoAg = ref(novoAgVazio())

// ─── Semana ──────────────────────────────────────────────────────────────
const diasSemana = computed(() => {
  const inicio = dayjs().startOf('week').add(semanaOffset.value, 'week')
  return [1, 2, 3, 4, 5, 6].map(dow => {
    const data = inicio.add(dow, 'day')
    return {
      key:          data.format('YYYY-MM-DD'),
      label:        DIAS_LABEL_CURTO[dow],
      data:         data.date(),
      dataCompleta: data.format('YYYY-MM-DD'),
      hoje:         data.isSame(dayjs(), 'day'),
    }
  })
})

const subtituloSemana = computed(() => {
  if (!diasSemana.value.length) return ''
  const inicio = dayjs(diasSemana.value[0].dataCompleta)
  const fim    = dayjs(diasSemana.value[diasSemana.value.length - 1].dataCompleta)
  return `${inicio.format('D')} – ${fim.format('D [de] MMMM [de] YYYY')}`
})

const mesSemana = computed(() => dayjs(diasSemana.value[0]?.dataCompleta).format('MMMM YYYY'))

// ─── Vista do dia ────────────────────────────────────────────────────────
const subtituloDia    = computed(() => dayjs(diaAtualStr.value).format('dddd, D [de] MMMM [de] YYYY'))
const diaDaSemanaLabel = computed(() => DIAS_LABEL_CURTO[dayjs(diaAtualStr.value).day()])
const diaNumero       = computed(() => dayjs(diaAtualStr.value).date())

const diaAnterior = () => { diaAtualStr.value = dayjs(diaAtualStr.value).subtract(1, 'day').format('YYYY-MM-DD') }
const diaProximo  = () => { diaAtualStr.value = dayjs(diaAtualStr.value).add(1, 'day').format('YYYY-MM-DD') }

const agendamentosNoDia = computed(() =>
  agendamentosStore.lista_agendamentos.filter(a => a.data_hora?.substring(0, 10) === diaAtualStr.value)
)

const agendamentoNaCelulaDia = (hora) =>
  agendamentosNoDia.value.find(a => a.data_hora?.substring(11, 16) === hora)

// ─── Tipos e mini cal ────────────────────────────────────────────────────
const tiposAtendimento = computed(() => disponibilidadeStore.lista_tipos_atendimento.filter(t => t.ativo !== false))

const miniCalBase = computed(() => dayjs().add(miniCalOffset.value, 'month').startOf('month'))
const mesMiniCal  = computed(() => miniCalBase.value.format('MMMM YYYY'))
const diasMiniCal = computed(() => {
  const base   = miniCalBase.value
  const offset = base.day()
  const total  = base.daysInMonth()
  const dias   = []
  for (let i = 0; i < offset; i++) dias.push(null)
  for (let d = 1; d <= total; d++) dias.push(d)
  return dias
})

const estiloMiniCalDia = (dia) => {
  if (!dia) return ''
  const data    = miniCalBase.value.date(dia)
  const hoje    = data.isSame(dayjs(), 'day')
  const naSemana = diasSemana.value.some(ds => dayjs(ds.dataCompleta).isSame(data, 'day'))
  const eDiaAtual = data.format('YYYY-MM-DD') === diaAtualStr.value && modoVista.value === 'dia'
  if (hoje || eDiaAtual) return 'background:var(--primary);color:#fff;font-weight:500;'
  if (naSemana && modoVista.value === 'semana') return 'background:var(--primary-soft);color:var(--primary-text);'
  return 'color:var(--text-2);'
}

const irParaDia = (dia) => {
  const data = miniCalBase.value.date(dia)
  if (modoVista.value === 'semana') {
    const diffSemanas = data.diff(dayjs().startOf('week').add(1, 'day'), 'week')
    semanaOffset.value = diffSemanas
  } else {
    diaAtualStr.value = data.format('YYYY-MM-DD')
  }
}

// ─── Agendamentos na semana ──────────────────────────────────────────────
const agendamentosNaSemana = computed(() => {
  const chaves = new Set(diasSemana.value.map(d => d.key))
  return agendamentosStore.lista_agendamentos.filter(a => chaves.has(a.data_hora?.substring(0, 10)))
})

const agendamentoNaCelula = (dataKey, hora) =>
  agendamentosNaSemana.value.find(a => a.data_hora?.substring(0, 10) === dataKey && a.data_hora?.substring(11, 16) === hora)

// ─── Estilo agendamentos ─────────────────────────────────────────────────
const corDoTipo = (tipoId) => {
  const idx = tiposAtendimento.value.findIndex(t => t.id === tipoId)
  return COR_POR_POSICAO[idx >= 0 ? idx % COR_POR_POSICAO.length : 0]
}

const estiloAgendamento = (ag) => {
  const cor    = corDoTipo(ag.tipo_atendimento_id)
  const dimido = ag.status === STATUS_AGENDAMENTO.REALIZADO
  const falta  = ag.status === STATUS_AGENDAMENTO.FALTA || ag.status === STATUS_AGENDAMENTO.CANCELADO
  return [
    `background: color-mix(in srgb, ${cor} 15%, var(--card));`,
    `border: 1px solid ${falta ? 'var(--status-falta)' : cor};`,
    `border-left: 2.5px solid ${cor};`,
    dimido ? 'opacity:0.6;' : '',
  ].join('')
}

// ─── Resumo ───────────────────────────────────────────────────────────────
const resumoSemana = computed(() => {
  const lista = agendamentosNaSemana.value
  return [
    { label: 'Total',       valor: lista.length },
    { label: 'Realizados',  valor: lista.filter(a => a.status === STATUS_AGENDAMENTO.REALIZADO).length },
    { label: 'Confirmados', valor: lista.filter(a => a.status === STATUS_AGENDAMENTO.CONFIRMADO).length },
    { label: 'Aguardando',  valor: lista.filter(a => a.status === STATUS_AGENDAMENTO.AGENDADO).length },
    { label: 'Faltas',      valor: lista.filter(a => a.status === STATUS_AGENDAMENTO.FALTA).length },
  ]
})

// ─── Pacientes ────────────────────────────────────────────────────────────
const opcoesPacientes = ref([])

const filtrarPacientes = (val, update) => {
  update(() => {
    const texto = val.toLowerCase()
    opcoesPacientes.value = pacientesStore.lista_pacientes
      .filter(p => (p.contatos?.nome || '').toLowerCase().includes(texto))
      .slice(0, 20)
      .map(p => ({ label: p.contatos?.nome || '?', value: p.contato_id }))
  })
}

const iniciais = (nome) => (nome || '?').split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()

// ─── Ações ────────────────────────────────────────────────────────────────
const abrirNovoAgendamento = (data, hora) => {
  novoAg.value = novoAgVazio()
  if (data) novoAg.value.data = data
  if (hora) novoAg.value.hora = hora
  modalAberto.value = true
}

const fecharModal = () => { modalAberto.value = false }

const criarAgendamento = async () => {
  if (!novoAg.value.contato_id) { $q.notify({ type: 'negative', message: 'Selecione um paciente.' }); return }
  if (!novoAg.value.data || !novoAg.value.hora) { $q.notify({ type: 'negative', message: 'Informe data e horário.' }); return }

  salvando.value = true
  const dataHora = `${novoAg.value.data}T${novoAg.value.hora}:00`
  const resultado = await agendamentosStore.postAgendamentoAction({
    agendamento: {
      contato_id:          novoAg.value.contato_id,
      tipo_atendimento_id: novoAg.value.tipo_atendimento_id || null,
      data_hora:           dataHora,
      duracao_minutos:     novoAg.value.duracao_minutos,
      notas:               novoAg.value.notas || null,
    },
  })
  salvando.value = false

  if (resultado.sucesso) {
    $q.notify({ type: 'positive', message: 'Agendamento criado!' })
    fecharModal()
    await carregarAgenda()
  } else {
    $q.notify({ type: 'negative', message: resultado.mensagem || 'Erro ao criar.' })
  }
}

const verAgendamento = (ag) => {
  agendamentoSelecionado.value = ag
  aguardandoNota.value = false
  notaRapida.value = ''
  modalDetalheAberto.value = true
}

const mudarStatus = async (status) => {
  if (!agendamentoSelecionado.value) return
  const resultado = await agendamentosStore.atualizarStatusAction({ id: agendamentoSelecionado.value.id, status })
  if (resultado.sucesso) {
    $q.notify({ type: 'positive', message: 'Status atualizado.' })
    agendamentoSelecionado.value = { ...agendamentoSelecionado.value, status }
    modalDetalheAberto.value = false
    await carregarAgenda()
  }
}

const iniciarRealizado = () => {
  aguardandoNota.value = true
}

const salvarRealizado = async (comNota) => {
  salvandoNota.value = true

  await mudarStatusDireto(STATUS_AGENDAMENTO.REALIZADO)

  if (comNota && notaRapida.value.trim()) {
    const paciente = pacientesStore.lista_pacientes.find(
      p => p.contato_id === agendamentoSelecionado.value?.contato_id
    )
    if (paciente) {
      const dataHoje  = dayjs().format('DD/MM/YYYY HH:mm')
      const obsAtuais = paciente.observacoes || ''
      const novaObs   = obsAtuais
        ? `${obsAtuais}\n\n[${dataHoje}] ${notaRapida.value.trim()}`
        : `[${dataHoje}] ${notaRapida.value.trim()}`
      await pacientesStore.putPacienteAction({ paciente: { ...paciente, observacoes: novaObs } })
    }
  }

  salvandoNota.value  = false
  aguardandoNota.value = false
  notaRapida.value    = ''
  modalDetalheAberto.value = false
  await carregarAgenda()
}

const mudarStatusDireto = async (status) => {
  if (!agendamentoSelecionado.value) return
  const resultado = await agendamentosStore.atualizarStatusAction({ id: agendamentoSelecionado.value.id, status })
  if (resultado.sucesso) {
    agendamentoSelecionado.value = { ...agendamentoSelecionado.value, status }
  }
}

const carregarAgenda = async () => {
  const inicio = dayjs(diasSemana.value[0]?.dataCompleta).startOf('day').toISOString()
  const fim    = dayjs(diasSemana.value[diasSemana.value.length - 1]?.dataCompleta).endOf('day').toISOString()
  await agendamentosStore.setListAgendamentosAction({ data_inicio: inicio, data_fim: fim })
}

watch(() => authStore.profissionalId, async (id) => {
  if (!id) return
  await Promise.all([
    carregarAgenda(),
    disponibilidadeStore.setListTiposAtendimentoAction(),
    pacientesStore.setListPacientesAction(),
  ])
  opcoesPacientes.value = pacientesStore.lista_pacientes.slice(0, 20).map(p => ({
    label: p.contatos?.nome || '?',
    value: p.contato_id,
  }))
}, { immediate: true })
</script>
