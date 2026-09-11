<template>
  <q-page class="fade-in">

    <!-- ─── Breadcrumb ────────────────────────────────────────── -->
    <div style="padding:20px 32px 0;">
      <button
        style="display:inline-flex;align-items:center;gap:6px;background:transparent;border:0;color:var(--text-2);font-size:12.5px;cursor:pointer;font-family:inherit;padding:0;"
        @click="$router.push({ name: 'pacientes' })"
      >
        <q-icon name="chevron_left" size="14px" /> Pacientes
      </button>
    </div>

    <!-- Carregando -->
    <div v-if="carregando" style="padding:20px 32px;">
      <q-skeleton type="rect" height="120px" class="q-mb-md" />
      <q-skeleton type="rect" height="300px" />
    </div>

    <!-- Paciente não encontrado -->
    <div v-else-if="!paciente" style="padding:48px 32px;text-align:center;">
      <q-icon name="person_off" size="48px" style="color:var(--text-3);" />
      <div class="t-h3" style="margin-top:12px;color:var(--text);">Paciente não encontrado</div>
      <q-btn class="q-px-sm" flat no-caps label="Voltar para a lista" style="color:var(--primary);margin-top:8px;" @click="$router.push({ name: 'pacientes' })" />
    </div>

    <template v-else>

      <!-- ─── Header do paciente ──────────────────────────────── -->
      <div style="padding:16px 32px 0;">
        <div class="atende-card" style="padding:20px;display:flex;align-items:center;gap:18px;">
          <span class="av" style="width:64px;height:64px;font-size:22px;font-weight:600;">{{ iniciais }}</span>

          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap;">
              <h2 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.015em;color:var(--text);">
                {{ paciente.contatos?.nome || '—' }}
              </h2>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <span
                  v-for="tag in (paciente.tags || [])"
                  :key="tag"
                  class="atende-tag"
                  :class="{ 'atende-tag--primary': tag === 'em-tratamento' }"
                >
                  {{ TAGS_PACIENTE.find(t => t.id === tag)?.label || tag }}
                </span>
              </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:16px;color:var(--text-2);font-size:13px;">
              <span v-if="idade" style="display:inline-flex;align-items:center;gap:6px;">
                <q-icon name="person" size="13px" style="color:var(--text-3);" />{{ idade }}
              </span>
              <span v-if="paciente.contatos?.telefone" style="display:inline-flex;align-items:center;gap:6px;">
                <q-icon name="phone" size="13px" style="color:var(--text-3);" />{{ paciente.contatos.telefone }}
              </span>
              <span v-if="paciente.contatos?.email" style="display:inline-flex;align-items:center;gap:6px;">
                <q-icon name="mail" size="13px" style="color:var(--text-3);" />{{ paciente.contatos.email }}
              </span>
              <span style="display:inline-flex;align-items:center;gap:6px;">
                <q-icon name="event" size="13px" style="color:var(--text-3);" />{{ totalSessoes }} sessões
              </span>
            </div>
          </div>

          <div style="display:flex;gap:8px;flex-shrink:0;">
            <q-btn class="q-px-sm"
              v-if="paciente.contatos?.telefone"
              outline no-caps dense icon="mdi-whatsapp"
              label="WhatsApp"
              style="border-color:var(--border);color:var(--text);border-radius:var(--radius-sm);"
              :href="`https://wa.me/55${paciente.contatos.telefone.replace(/\D/g, '')}`"
              target="_blank"
            />
            <q-btn class="q-px-sm"
              unelevated no-caps dense icon="add"
              label="Agendar"
              style="background:var(--primary);color:#fff;border-radius:var(--radius-sm);"
              @click="$router.push({ name: 'agenda' })"
            />
          </div>
        </div>
      </div>

      <!-- ─── Tabs ───────────────────────────────────────────── -->
      <div style="padding:20px 32px 0;">
        <div style="display:flex;gap:4px;border-bottom:1px solid var(--border);">
          <button
            class="atende-tab"
            :class="{ active: abaAtiva === 'historico' }"
            @click="abaAtiva = 'historico'"
          >Histórico ({{ historico.length }})</button>
          <button
            class="atende-tab"
            :class="{ active: abaAtiva === 'anexos' }"
            @click="abaAtiva = 'anexos'"
          >Anexos ({{ (paciente.anexos || []).length }})</button>
          <button
            class="atende-tab"
            :class="{ active: abaAtiva === 'observacoes' }"
            @click="abaAtiva = 'observacoes'"
          >Observações</button>
        </div>
      </div>

      <!-- ─── Conteúdo das abas ───────────────────────────────── -->
      <div style="padding:20px 32px 32px;">

        <!-- ABA: Histórico -->
        <div v-if="abaAtiva === 'historico'">
          <div v-if="carregandoHistorico" class="atende-card" style="padding:24px;">
            <q-skeleton v-for="n in 4" :key="n" type="text" class="q-mb-sm" />
          </div>

          <div v-else-if="!historico.length" class="atende-card" style="padding:48px 24px;text-align:center;">
            <q-icon name="event_note" size="40px" style="color:var(--text-3);" />
            <div class="t-h3" style="margin-top:12px;color:var(--text);">Sem atendimentos registrados</div>
            <div class="t-small">O histórico aparecerá aqui após o primeiro agendamento.</div>
          </div>

          <div v-else class="atende-card">
            <div
              v-for="(ag, i) in historico"
              :key="ag.id"
              class="row-hover"
              style="display:grid;grid-template-columns:110px 60px 1fr auto 20px;gap:16px;padding:12px 18px;align-items:center;"
              :style="i < historico.length - 1 ? 'border-bottom:1px solid var(--border);' : ''"
            >
              <span class="t-num" style="font-size:13px;color:var(--text);">{{ formatarData(ag.data_hora) }}</span>
              <span class="t-num" style="font-size:13px;color:var(--text-2);">{{ formatarHora(ag.data_hora) }}</span>
              <span style="font-size:13.5px;font-weight:500;color:var(--text);">
                {{ ag.tipos_atendimento?.nome || ag.tipo_atendimento?.nome || 'Atendimento' }}
              </span>
              <span class="badge" :class="`badge-${ag.status}`">
                <span class="dot"></span>{{ STATUS_LABELS[ag.status] }}
              </span>
              <q-icon name="chevron_right" size="14px" style="color:var(--text-3);" />
            </div>
          </div>
        </div>

        <!-- ABA: Anexos -->
        <div v-if="abaAtiva === 'anexos'">

          <!-- Zona de upload -->
          <div
            class="upload-zone q-mb-md"
            :class="{ dragging: arrastando }"
            @dragover.prevent="arrastando = true"
            @dragleave="arrastando = false"
            @drop.prevent="aoSoltarArquivo"
            @click="$refs.inputArquivo.click()"
          >
            <input ref="inputArquivo" type="file" multiple style="display:none;" @change="aoSelecionarArquivos" />
            <div style="width:40px;height:40px;border-radius:10px;background:var(--card-2);border:1px solid var(--border);display:inline-flex;align-items:center;justify-content:center;color:var(--text-2);margin-bottom:10px;">
              <q-icon name="upload" size="18px" />
            </div>
            <div style="font-size:13.5px;font-weight:500;margin-bottom:4px;color:var(--text);">
              Arraste arquivos aqui ou clique para selecionar
            </div>
            <div class="t-small">PDF, imagens, áudios — sem limite de tipo.</div>
          </div>

          <!-- Progresso de upload -->
          <div v-if="enviando" class="atende-card q-mb-md" style="padding:14px 18px;display:flex;align-items:center;gap:12px;">
            <q-circular-progress indeterminate size="24px" color="primary" />
            <span class="t-small">Enviando arquivo…</span>
          </div>

          <!-- Grid de anexos -->
          <div v-if="!(paciente.anexos || []).length && !enviando" style="padding:32px 0;text-align:center;">
            <q-icon name="attach_file" size="40px" style="color:var(--text-3);" />
            <div class="t-small" style="margin-top:8px;">Nenhum arquivo anexado ainda.</div>
          </div>

          <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
            <div
              v-for="anexo in (paciente.anexos || [])"
              :key="anexo.id"
              class="atende-card row-hover cursor-pointer"
              style="padding:14px;display:flex;align-items:flex-start;gap:12px;"
              @click="baixarAnexo(anexo)"
            >
              <div style="width:38px;height:38px;border-radius:8px;background:var(--primary-soft);color:var(--primary-text);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <q-icon :name="iconeAnexo(anexo.tipo_mime)" size="18px" />
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text);">
                  {{ anexo.nome_arquivo }}
                </div>
                <div class="t-small" style="font-size:11.5px;">
                  {{ formatarTamanho(anexo.tamanho_bytes) }} · {{ formatarData(anexo.criado_em) }}
                </div>
              </div>
              <div style="display:flex;gap:2px;flex-shrink:0;">
                <q-btn class="q-px-sm"
                  flat round dense size="sm"
                  :icon="linkCopiado === anexo.id ? 'check' : 'link'"
                  :style="linkCopiado === anexo.id ? 'color:var(--status-confirmado);' : 'color:var(--text-2);'"
                  @click.stop="copiarLinkAnexo(anexo)"
                >
                  <q-tooltip anchor="top middle" self="bottom middle">Copiar link</q-tooltip>
                </q-btn>
                <q-btn class="q-px-sm"
                  flat round dense size="sm" icon="download"
                  style="color:var(--text-2);"
                  @click.stop="baixarAnexo(anexo)"
                >
                  <q-tooltip anchor="top middle" self="bottom middle">Baixar</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>
        </div>

        <!-- ABA: Observações -->
        <div v-if="abaAtiva === 'observacoes'">
          <div class="atende-card" style="padding:18px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <div class="t-h3">Observações livres</div>
              <span class="t-small" style="font-size:11.5px;">
                <span v-if="salvandoObs">Salvando…</span>
                <span v-else-if="obsUltimoSalvo">Salvo {{ obsUltimoSalvo }}</span>
              </span>
            </div>
            <q-input
              v-model="observacoes"
              type="textarea"
              outlined
              :rows="12"
              placeholder="Anotações clínicas, evolução, observações gerais…"
              style="font-size:13.5px;"
              @update:model-value="agendarSalvamentoObs"
            />
            <div class="t-small" style="margin-top:10px;font-size:11.5px;">
              Campo livre — sem estrutura obrigatória. Use anexos para PDFs, fotos, áudios.
            </div>
          </div>
        </div>

      </div>
    </template>

  </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import dayjs from 'dayjs'
import { useAuthStore }          from 'src/stores/authStore'
import { usePacientesStore }    from 'src/stores/pacientesStore'
import { useAgendamentosStore } from 'src/stores/agendamentosStore'
import { useAnexos }            from 'src/composables/useAnexos'
import { formatarData, formatarHora, formatarTamanhoArquivo } from 'src/utils/helpers'
import { STATUS_LABELS, STATUS_AGENDAMENTO } from 'src/constants/status'
import { TAGS_PACIENTE } from 'src/constants/tags'

const $q    = useQuasar()
const route = useRoute()
const authStore         = useAuthStore()
const pacientesStore    = usePacientesStore()
const agendamentosStore = useAgendamentosStore()
const { uploadAnexo, gerarLinkCompartilhamento } = useAnexos()

const abaAtiva   = ref('historico')
const arrastando = ref(false)
const enviando   = ref(false)
const inputArquivo = ref(null)
const linkCopiado  = ref(null)

const observacoes      = ref('')
const salvandoObs      = ref(false)
const obsUltimoSalvo   = ref('')
let timerSalvamento = null

const carregando         = computed(() => pacientesStore.carregando)
const carregandoHistorico = computed(() => agendamentosStore.carregando)

const paciente = computed(() => pacientesStore.paciente)

const iniciais = computed(() => {
  const nome = paciente.value?.contatos?.nome || ''
  return nome.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase() || '?'
})

const idade = computed(() => {
  if (!paciente.value?.data_nascimento) return ''
  return `${dayjs().diff(dayjs(paciente.value.data_nascimento), 'year')} anos`
})

const historico = computed(() =>
  agendamentosStore.lista_agendamentos
    .filter(a => a.contato_id === paciente.value?.contato_id)
    .sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora))
)

const totalSessoes = computed(() =>
  historico.value.filter(a => a.status === STATUS_AGENDAMENTO.REALIZADO).length
)

const iconeAnexo = (mime) => {
  if (!mime) return 'attach_file'
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('audio/')) return 'mic'
  if (mime === 'application/pdf') return 'picture_as_pdf'
  return 'description'
}

const formatarTamanho = (bytes) => formatarTamanhoArquivo(bytes)

const baixarAnexo = async (anexo) => {
  const url = await gerarLinkCompartilhamento(anexo.url_storage, 3600)
  if (url) window.open(url, '_blank')
}

const copiarLinkAnexo = async (anexo) => {
  const url = await gerarLinkCompartilhamento(anexo.url_storage, 86400)
  if (url) {
    await navigator.clipboard.writeText(url)
    linkCopiado.value = anexo.id
    setTimeout(() => { linkCopiado.value = null }, 2500)
  }
}

const processarArquivos = async (files) => {
  if (!paciente.value) return
  enviando.value = true
  for (const arquivo of Array.from(files)) {
    const resultado = await uploadAnexo({ arquivo, pacienteId: paciente.value.id })
    if (!resultado.sucesso) {
      $q.notify({ type: 'negative', message: `Erro ao enviar ${arquivo.name}` })
    }
  }
  enviando.value = false
  await pacientesStore.setPacienteByIdAction({ id: route.params.id })
}

const aoSoltarArquivo = (evt) => {
  arrastando.value = false
  processarArquivos(evt.dataTransfer.files)
}

const aoSelecionarArquivos = (evt) => {
  processarArquivos(evt.target.files)
}

const agendarSalvamentoObs = () => {
  clearTimeout(timerSalvamento)
  timerSalvamento = setTimeout(salvarObservacoes, 1500)
}

const salvarObservacoes = async () => {
  if (!paciente.value) return
  salvandoObs.value = true
  await pacientesStore.putPacienteAction({
    paciente: { ...paciente.value, observacoes: observacoes.value },
  })
  salvandoObs.value  = false
  obsUltimoSalvo.value = 'há pouco'
}

watch(paciente, (novo) => {
  if (novo) observacoes.value = novo.observacoes || ''
}, { immediate: true })

watch(
  () => [authStore.profissionalId, route.params.id],
  async ([profId, routeId]) => {
    if (!profId || !routeId) return
    await pacientesStore.setPacienteByIdAction({ id: routeId })
    if (paciente.value?.contato_id) {
      await agendamentosStore.setListAgendamentosAction({
        data_inicio: dayjs().subtract(2, 'year').toISOString(),
        data_fim:    dayjs().toISOString(),
      })
    }
  },
  { immediate: true }
)
</script>
