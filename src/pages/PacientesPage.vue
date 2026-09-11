<template>
  <q-page class="fade-in">

    <!-- ─── Cabeçalho ─────────────────────────────────────────── -->
    <div class="page-header">
      <div>
        <div class="t-h1">Pacientes</div>
        <div class="t-small" style="margin-top:4px;">
          {{ pacientesStore.lista_pacientes.length }} cadastrado{{ pacientesStore.lista_pacientes.length !== 1 ? 's' : '' }}
          <span v-if="emTratamento"> · {{ emTratamento }} em tratamento</span>
        </div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn class="q-px-sm" outline no-caps dense icon="add" label="Novo paciente" style="background:var(--primary);color:#fff;border:none;border-radius:var(--radius-sm);" @click="dialogAberto = true" />
      </div>
    </div>

    <!-- ─── Filtros ────────────────────────────────────────────── -->
    <div style="padding:0 32px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <div style="flex:1;max-width:360px;">
        <q-input
          v-model="busca"
          dense
          outlined
          placeholder="Buscar por nome ou telefone…"
          style="border-radius:var(--radius-sm);"
        >
          <template #prepend>
            <q-icon name="search" size="15px" style="color:var(--text-3);" />
          </template>
          <template #append>
            <q-icon v-if="busca" name="close" size="14px" class="cursor-pointer" style="color:var(--text-3);" @click="busca = ''" />
          </template>
        </q-input>
      </div>

      <div class="seg">
        <button :class="{ active: tagFiltro === '' }" @click="tagFiltro = ''">Todos</button>
        <button v-for="t in TAGS_PACIENTE" :key="t.id" :class="{ active: tagFiltro === t.id }" @click="tagFiltro = t.id">{{ t.label }}</button>
      </div>
    </div>

    <!-- ─── Tabela ─────────────────────────────────────────────── -->
    <div style="padding:0 32px 32px;">
      <div class="atende-card">

        <!-- Cabeçalho colunas -->
        <div class="row items-center t-tiny" style="padding:12px 18px;border-bottom:1px solid var(--border);background:var(--card-2);gap:14px;">
          <div style="width:36px;"></div>
          <div style="flex:1.4;">Nome</div>
          <div style="flex:1;">Telefone</div>
          <div style="flex:1;">Último atend.</div>
          <div style="flex:0.7;text-align:right;">Sessões</div>
          <div style="flex:1.2;">Tags</div>
          <div style="width:36px;"></div>
        </div>

        <!-- Skeleton de loading -->
        <div v-if="carregando">
          <div v-for="n in 5" :key="n" style="padding:16px 18px;border-bottom:1px solid var(--border);">
            <q-skeleton type="text" />
          </div>
        </div>

        <!-- Estado vazio -->
        <div v-else-if="!listafiltrada.length" style="padding:48px 24px;text-align:center;">
          <div style="width:64px;height:64px;border-radius:16px;background:var(--card-2);border:1px solid var(--border);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
            <q-icon name="search" size="24px" style="color:var(--text-3);" />
          </div>
          <div class="t-h3" style="color:var(--text);">Nenhum paciente encontrado</div>
          <div class="t-small">Tente buscar por outro nome ou limpar os filtros.</div>
        </div>

        <!-- Linhas de pacientes -->
        <div
          v-for="(paciente, i) in listafiltrada"
          :key="paciente.id"
          class="row-hover cursor-pointer row items-center"
          style="padding:12px 18px;gap:14px;"
          :style="i < listafiltrada.length - 1 ? 'border-bottom:1px solid var(--border);' : ''"
          @click="$router.push({ name: 'paciente-detalhe', params: { id: paciente.id } })"
        >
          <div style="width:36px;">
            <span class="av" style="width:30px;height:30px;font-size:11px;">
              {{ iniciais(paciente.contatos?.nome || '') }}
            </span>
          </div>

          <div style="flex:1.4;min-width:0;">
            <div style="font-size:13.5px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text);">
              {{ paciente.contatos?.nome || '—' }}
            </div>
            <div class="t-small" style="font-size:11.5px;">{{ idadePaciente(paciente) }}</div>
          </div>

          <div style="flex:1;" class="t-num">
            <span style="font-size:13px;color:var(--text-2);">{{ paciente.contatos?.telefone || '—' }}</span>
          </div>

          <div style="flex:1;">
            <span style="font-size:13px;color:var(--text-2);">{{ ultimoAtendimento(paciente) }}</span>
          </div>

          <div style="flex:0.7;text-align:right;" class="t-num">
            <span style="font-size:13.5px;font-weight:500;color:var(--text);">{{ totalSessoes(paciente) }}</span>
          </div>

          <div style="flex:1.2;display:flex;gap:4px;flex-wrap:wrap;">
            <span
              v-for="tag in (paciente.tags || []).slice(0, 2)"
              :key="tag"
              class="atende-tag"
              :class="{ 'atende-tag--primary': tag === 'em-tratamento' || tag === 'novo' }"
            >
              {{ TAGS_PACIENTE.find(t => t.id === tag)?.label || tag }}
            </span>
          </div>

          <div style="width:36px;">
            <q-btn class="q-px-sm"
              flat round dense size="sm" icon="more_vert"
              style="color:var(--text-3);"
              @click.stop="abrirMenu(paciente)"
            />
          </div>
        </div>

      </div>
    </div>

    <!-- ─── Dialog novo paciente ──────────────────────────────── -->
    <q-dialog v-model="dialogAberto" persistent>
      <q-card style="width:520px;max-width:calc(100vw - 32px);background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);">

        <q-card-section style="padding:20px 24px 0;">
          <div class="t-h2">Novo paciente</div>
        </q-card-section>

        <q-card-section style="padding:16px 24px;display:flex;flex-direction:column;gap:14px;">
          <div>
            <div class="t-small" style="margin-bottom:6px;font-weight:500;">Nome completo *</div>
            <q-input v-model="form.nome" dense outlined placeholder="Nome do paciente" />
          </div>

          <div class="row q-gutter-sm">
            <div class="col">
              <div class="t-small" style="margin-bottom:6px;font-weight:500;">Telefone</div>
              <q-input v-model="form.telefone" dense outlined placeholder="(11) 9 0000-0000" />
            </div>
            <div class="col">
              <div class="t-small" style="margin-bottom:6px;font-weight:500;">Data de nascimento</div>
              <q-input v-model="form.data_nascimento" dense outlined type="date" />
            </div>
          </div>

          <div>
            <div class="t-small" style="margin-bottom:6px;font-weight:500;">E-mail</div>
            <q-input v-model="form.email" dense outlined placeholder="email@exemplo.com" type="email" />
          </div>

          <div>
            <div class="t-small" style="margin-bottom:6px;font-weight:500;">Tags</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <span
                v-for="tag in TAGS_PACIENTE"
                :key="tag.id"
                class="atende-tag cursor-pointer"
                :class="{ 'atende-tag--primary': form.tags.includes(tag.id) }"
                @click="toggleTag(tag.id)"
              >{{ tag.label }}</span>
            </div>
          </div>

          <div>
            <div class="t-small" style="margin-bottom:6px;font-weight:500;">Observações</div>
            <q-input
              v-model="form.observacoes"
              dense outlined type="textarea"
              :rows="3"
              placeholder="Histórico, queixas, informações relevantes…"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" style="padding:12px 24px 20px;gap:8px;">
          <q-btn class="q-px-sm" flat no-caps label="Cancelar" style="color:var(--text-2);" @click="fecharDialog" />
          <q-btn class="q-px-sm"
            unelevated no-caps label="Salvar paciente"
            :loading="salvando"
            style="background:var(--primary);color:#fff;border-radius:var(--radius-sm);"
            @click="salvar"
          />
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
import { useAuthStore }          from 'src/stores/authStore'
import { usePacientesStore }    from 'src/stores/pacientesStore'
import { useAgendamentosStore } from 'src/stores/agendamentosStore'
import { formatarDataRelativa } from 'src/utils/helpers'
import { TAGS_PACIENTE } from 'src/constants/tags'
import { STATUS_AGENDAMENTO } from 'src/constants/status'

const $q     = useQuasar()
const router = useRouter()
const authStore         = useAuthStore()
const pacientesStore    = usePacientesStore()
const agendamentosStore = useAgendamentosStore()

const busca        = ref('')
const tagFiltro    = ref('')
const dialogAberto = ref(false)
const salvando     = ref(false)

const carregando = computed(() => pacientesStore.carregando)

const formVazio = () => ({
  nome:            '',
  telefone:        '',
  email:           '',
  data_nascimento: '',
  tags:            [],
  observacoes:     '',
})
const form = ref(formVazio())

const listafiltrada = computed(() =>
  pacientesStore.lista_pacientes.filter(paciente => {
    const nome  = paciente.contatos?.nome?.toLowerCase() || ''
    const tel   = paciente.contatos?.telefone || ''
    const textoOk = !busca.value || nome.includes(busca.value.toLowerCase()) || tel.includes(busca.value)
    const tagOk   = !tagFiltro.value || (paciente.tags || []).includes(tagFiltro.value)
    return textoOk && tagOk
  })
)

const emTratamento = computed(() =>
  pacientesStore.lista_pacientes.filter(p => (p.tags || []).includes('em-tratamento')).length
)

const iniciais = (nome) =>
  (nome || '?').split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()

const idadePaciente = (paciente) => {
  if (!paciente.data_nascimento) return ''
  return `${dayjs().diff(dayjs(paciente.data_nascimento), 'year')} anos`
}

const ultimoAtendimento = (paciente) => {
  const lista = agendamentosStore.lista_agendamentos.filter(
    a => a.contato_id === paciente.contato_id && a.status === STATUS_AGENDAMENTO.REALIZADO
  )
  if (!lista.length) return '—'
  const ultimo = lista.sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora))[0]
  return formatarDataRelativa(ultimo.data_hora)
}

const totalSessoes = (paciente) =>
  agendamentosStore.lista_agendamentos.filter(
    a => a.contato_id === paciente.contato_id && a.status === STATUS_AGENDAMENTO.REALIZADO
  ).length

const toggleTag = (tagId) => {
  const idx = form.value.tags.indexOf(tagId)
  if (idx >= 0) form.value.tags.splice(idx, 1)
  else form.value.tags.push(tagId)
}

const fecharDialog = () => {
  dialogAberto.value = false
  form.value = formVazio()
}

const salvar = async () => {
  if (!form.value.nome.trim()) {
    $q.notify({ type: 'negative', message: 'Nome é obrigatório.' })
    return
  }
  salvando.value = true
  const resultado = await pacientesStore.postPacienteAction({
    nome:            form.value.nome.trim(),
    telefone:        form.value.telefone || null,
    email:           form.value.email || null,
    data_nascimento: form.value.data_nascimento || null,
    tags:            form.value.tags,
    observacoes:     form.value.observacoes || null,
  })
  salvando.value = false

  if (resultado.sucesso) {
    $q.notify({ type: 'positive', message: 'Paciente cadastrado com sucesso.' })
    fecharDialog()
    await pacientesStore.setListPacientesAction()
  } else {
    $q.notify({ type: 'negative', message: resultado.mensagem || 'Erro ao cadastrar.' })
  }
}

const abrirMenu = (paciente) => {
  $q.dialog({
    title: paciente.contatos?.nome || 'Paciente',
    message: 'O que deseja fazer?',
    options: {
      type: 'radio',
      model: 'ver',
      items: [
        { label: 'Ver perfil completo', value: 'ver' },
        { label: 'Remover paciente',    value: 'remover' },
      ],
    },
    cancel: true,
    ok: 'Confirmar',
  }).onOk(async (acao) => {
    if (acao === 'ver') {
      router.push({ name: 'paciente-detalhe', params: { id: paciente.id } })
    } else if (acao === 'remover') {
      const resultado = await pacientesStore.deletePacienteAction({ paciente })
      if (resultado.sucesso) {
        $q.notify({ type: 'positive', message: 'Paciente removido.' })
        await pacientesStore.setListPacientesAction()
      }
    }
  })
}

watch(() => authStore.profissionalId, async (id) => {
  if (!id) return
  await Promise.all([
    pacientesStore.setListPacientesAction(),
    agendamentosStore.setListAgendamentosAction({
      data_inicio: dayjs().subtract(6, 'month').toISOString(),
      data_fim:    dayjs().toISOString(),
    }),
  ])
}, { immediate: true })
</script>
