<template>
  <q-page class="fade-in">

    <!-- ─── Cabeçalho ─────────────────────────────────────────── -->
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:10px;">
        <q-btn class="q-px-sm"
          v-if="secaoAtiva"
          flat round dense
          icon="arrow_back"
          style="color:var(--text-2);"
          @click="secaoAtiva = null"
        />
        <div>
          <div class="t-h1">{{ secaoAtiva ? SECOES.find(s => s.id === secaoAtiva)?.titulo : 'Configurações' }}</div>
          <div class="t-small" style="margin-top:4px;">
            {{ secaoAtiva ? SECOES.find(s => s.id === secaoAtiva)?.desc : 'Perfil profissional, WhatsApp, política de cancelamento.' }}
          </div>
        </div>
      </div>
    </div>

    <div style="padding:0 32px 32px;">

      <!-- ─── Hub: grade de cards ──────────────────────────────── -->
      <div v-if="!secaoAtiva" style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
        <button
          v-for="secao in SECOES"
          :key="secao.id"
          class="atende-card row-hover"
          style="display:flex;align-items:flex-start;gap:12px;padding:18px;cursor:pointer;text-align:left;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);width:100%;"
          @click="secaoAtiva = secao.id"
        >
          <div style="width:36px;height:36px;border-radius:8px;background:var(--primary-soft);color:var(--primary-text);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <q-icon :name="secao.icone" size="18px"/>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span style="font-size:14px;font-weight:500;color:var(--text);">{{ secao.titulo }}</span>
              <span v-if="secao.badge" style="font-size:11px;font-weight:500;padding:2px 8px;border-radius:20px;background:color-mix(in srgb, var(--status-confirmado) 15%, var(--card));color:var(--status-confirmado);">{{ secao.badge }}</span>
            </div>
            <div class="t-small">{{ secao.desc }}</div>
          </div>
          <q-icon name="chevron_right" size="16px" style="color:var(--text-3);margin-top:2px;flex-shrink:0;"/>
        </button>
      </div>

      <!-- ─── Seção: Perfil ────────────────────────────────────── -->
      <div v-if="secaoAtiva === 'perfil'" style="max-width:560px;">
        <div class="atende-card" style="padding:20px;display:flex;flex-direction:column;gap:16px;">
          <div class="t-h3">Informações do profissional</div>

          <div>
            <div class="t-small" style="margin-bottom:6px;font-weight:500;">Nome completo</div>
            <q-input v-model="perfil.nome_completo" dense outlined placeholder="Seu nome completo" />
          </div>

          <div class="row q-gutter-sm">
            <div class="col">
              <div class="t-small" style="margin-bottom:6px;font-weight:500;">Especialidade</div>
              <q-select
                v-model="perfil.especialidade"
                :options="ESPECIALIDADES"
                option-value="value"
                option-label="label"
                emit-value map-options
                dense outlined
              />
            </div>
            <div class="col">
              <div class="t-small" style="margin-bottom:6px;font-weight:500;">Registro profissional</div>
              <q-input v-model="perfil.registro_profissional" dense outlined placeholder="CREFITO 12.345-F" />
            </div>
          </div>

          <div>
            <div class="t-small" style="margin-bottom:6px;font-weight:500;">
              Slug da página pública
              <span class="t-tiny" style="margin-left:6px;text-transform:none;letter-spacing:0;">
                atende.app/<strong>{{ perfil.slug || 'seu-slug' }}</strong>
              </span>
            </div>
            <q-input v-model="perfil.slug" dense outlined placeholder="seu-nome" />
          </div>

          <div>
            <div class="t-small" style="margin-bottom:6px;font-weight:500;">Bio curta (exibida na página pública)</div>
            <q-input v-model="perfil.bio" dense outlined type="textarea" :rows="3" placeholder="Fisioterapia ortopédica e esportiva. Atendimento individual em São Paulo." />
          </div>

          <div>
            <div class="t-small" style="margin-bottom:6px;font-weight:500;">Telefone / WhatsApp</div>
            <q-input v-model="perfil.telefone" dense outlined placeholder="+55 11 9 0000-0000" />
          </div>

          <div style="display:flex;justify-content:flex-end;">
            <q-btn class="q-px-sm" unelevated no-caps label="Salvar perfil" :loading="salvandoPerfil" style="background:var(--primary);color:#fff;border-radius:var(--radius-sm);" @click="salvarPerfil" />
          </div>
        </div>
      </div>

      <!-- ─── Seção: Horários ──────────────────────────────────── -->
      <div v-if="secaoAtiva === 'horarios'" style="max-width:640px;">
        <div class="t-small q-mb-md">Configure os dias e horários em que você atende. Estes horários ficam visíveis na sua página pública.</div>
        <div class="atende-card" style="overflow:hidden;">
          <div
            v-for="dia in DIAS_SEMANA" :key="dia.value"
            style="display:grid;grid-template-columns:160px auto 1fr auto;gap:16px;align-items:center;padding:14px 18px;"
            :style="dia.value < DIAS_SEMANA.length - 1 ? 'border-bottom:1px solid var(--border);' : ''"
          >
            <div style="font-size:13.5px;font-weight:500;color:var(--text);">{{ dia.label }}</div>
            <q-toggle v-model="disponibilidadesPorDia[dia.value].ativo" color="primary" dense @update:model-value="salvarDisponibilidade(dia.value)" />
            <div v-if="disponibilidadesPorDia[dia.value].ativo" class="row q-gutter-sm items-center">
              <q-input
                v-model="disponibilidadesPorDia[dia.value].hora_inicio"
                type="time" dense outlined style="width:110px;"
                @update:model-value="salvarDisponibilidade(dia.value)"
              />
              <span class="t-small">até</span>
              <q-input
                v-model="disponibilidadesPorDia[dia.value].hora_fim"
                type="time" dense outlined style="width:110px;"
                @update:model-value="salvarDisponibilidade(dia.value)"
              />
            </div>
            <div v-else class="t-small">Não atendo</div>
            <div v-if="disponibilidadesPorDia[dia.value].ativo">
              <q-input
                v-model.number="disponibilidadesPorDia[dia.value].duracao_slot"
                type="number" dense outlined style="width:80px;"
                suffix="min"
                @update:model-value="salvarDisponibilidade(dia.value)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Seção: Tipos de atendimento ─────────────────────── -->
      <div v-if="secaoAtiva === 'tipos'">
        <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
          <q-btn class="q-px-sm" unelevated no-caps dense icon="add" label="Novo tipo" style="background:var(--primary);color:#fff;border-radius:var(--radius-sm);" @click="abrirDialogTipo()" />
        </div>

        <div class="atende-card" style="max-width:640px;overflow:hidden;">
          <div v-if="!disponibilidadeStore.lista_tipos_atendimento.length" style="padding:48px 24px;text-align:center;">
            <q-icon name="medical_services" size="40px" style="color:var(--text-3);" />
            <div class="t-h3" style="margin-top:12px;color:var(--text);">Nenhum tipo cadastrado</div>
            <div class="t-small">Adicione os tipos de atendimento que você oferece.</div>
          </div>

          <div
            v-for="(tipo, i) in disponibilidadeStore.lista_tipos_atendimento"
            :key="tipo.id"
            class="row-hover"
            style="display:flex;align-items:center;gap:16px;padding:14px 18px;"
            :style="i < disponibilidadeStore.lista_tipos_atendimento.length - 1 ? 'border-bottom:1px solid var(--border);' : ''"
          >
            <div style="width:10px;height:10px;border-radius:3px;flex-shrink:0;" :style="`background:${tipo.cor || 'var(--primary)'};`"></div>
            <div style="flex:1;">
              <div style="font-size:13.5px;font-weight:500;color:var(--text);">
                {{ tipo.nome }}
                <span v-if="!tipo.ativo" class="atende-tag" style="margin-left:8px;font-size:10px;">Inativo</span>
              </div>
              <div class="t-small" style="font-size:12px;">{{ tipo.duracao_minutos }} min<span v-if="tipo.valor"> · R$ {{ tipo.valor }}</span></div>
            </div>
            <div style="display:flex;gap:6px;">
              <q-btn class="q-px-sm" flat round dense size="sm" icon="edit" style="color:var(--text-2);" @click="abrirDialogTipo(tipo)" />
              <q-btn class="q-px-sm" flat round dense size="sm" icon="delete_outline" style="color:var(--status-falta);" @click="desativarTipo(tipo)" />
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Seção: Bloqueios ─────────────────────────────────── -->
      <div v-if="secaoAtiva === 'bloqueios'" style="max-width:640px;">
        <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
          <q-btn class="q-px-sm" unelevated no-caps dense icon="block" label="Bloquear horário" style="background:var(--primary);color:#fff;border-radius:var(--radius-sm);" @click="dialogBloqueioAberto = true" />
        </div>

        <div class="atende-card" style="overflow:hidden;">
          <div v-if="!disponibilidadeStore.lista_bloqueios.length" style="padding:48px 24px;text-align:center;">
            <q-icon name="event_busy" size="40px" style="color:var(--text-3);" />
            <div class="t-h3" style="margin-top:12px;color:var(--text);">Sem bloqueios futuros</div>
            <div class="t-small">Bloqueie datas ou períodos em que não estará disponível.</div>
          </div>

          <div
            v-for="(bloqueio, i) in disponibilidadeStore.lista_bloqueios"
            :key="bloqueio.id"
            style="display:flex;align-items:center;gap:16px;padding:14px 18px;"
            :style="i < disponibilidadeStore.lista_bloqueios.length - 1 ? 'border-bottom:1px solid var(--border);' : ''"
          >
            <q-icon name="block" size="16px" style="color:var(--status-falta);" />
            <div style="flex:1;">
              <div style="font-size:13.5px;font-weight:500;color:var(--text);">{{ formatarDataHora(bloqueio.data_hora_inicio) }}</div>
              <div class="t-small" style="font-size:12px;">até {{ formatarDataHora(bloqueio.data_hora_fim) }}<span v-if="bloqueio.motivo"> · {{ bloqueio.motivo }}</span></div>
            </div>
            <q-btn class="q-px-sm" flat round dense size="sm" icon="close" style="color:var(--text-2);" @click="removerBloqueio(bloqueio)" />
          </div>
        </div>
      </div>

      <!-- ─── Seções em breve ──────────────────────────────────── -->
      <div v-if="secaoAtiva === 'whatsapp' || secaoAtiva === 'textos' || secaoAtiva === 'cancelamento'" style="max-width:560px;">
        <div class="atende-card" style="padding:48px 24px;text-align:center;">
          <q-icon name="construction" size="40px" style="color:var(--text-3);" />
          <div class="t-h3" style="margin-top:12px;color:var(--text);">Em breve</div>
          <div class="t-small">Esta seção está em desenvolvimento.</div>
        </div>
      </div>

    </div>

    <!-- ─── Dialog tipo de atendimento ────────────────────────── -->
    <q-dialog v-model="dialogTipoAberto" persistent>
      <q-card style="width:420px;max-width:calc(100vw - 32px);background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);">
        <q-card-section style="padding:20px 24px 0;">
          <div class="t-h2">{{ tipoForm.id ? 'Editar tipo' : 'Novo tipo de atendimento' }}</div>
        </q-card-section>
        <q-card-section style="padding:16px 24px;display:flex;flex-direction:column;gap:14px;">
          <div>
            <div class="t-small" style="margin-bottom:6px;font-weight:500;">Nome *</div>
            <q-input v-model="tipoForm.nome" dense outlined placeholder="Ex: Sessão, Avaliação, Reavaliação…" />
          </div>
          <div class="row q-gutter-sm">
            <div class="col">
              <div class="t-small" style="margin-bottom:6px;font-weight:500;">Duração (min) *</div>
              <q-input v-model.number="tipoForm.duracao_minutos" dense outlined type="number" min="10" max="240" step="5" />
            </div>
            <div class="col">
              <div class="t-small" style="margin-bottom:6px;font-weight:500;">Valor (R$)</div>
              <q-input v-model.number="tipoForm.valor" dense outlined type="number" min="0" step="10" placeholder="0" />
            </div>
          </div>
          <div>
            <div class="t-small" style="margin-bottom:6px;font-weight:500;">Cor</div>
            <div style="display:flex;gap:8px;">
              <div
                v-for="cor in CORES_TIPO" :key="cor"
                style="width:28px;height:28px;border-radius:6px;cursor:pointer;transition:transform 120ms;"
                :style="`background:${cor};${tipoForm.cor === cor ? 'outline:2px solid var(--text);outline-offset:2px;' : ''}`"
                @click="tipoForm.cor = cor"
              ></div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" style="padding:12px 24px 20px;gap:8px;">
          <q-btn class="q-px-sm" flat no-caps label="Cancelar" style="color:var(--text-2);" @click="dialogTipoAberto = false" />
          <q-btn class="q-px-sm" unelevated no-caps :label="tipoForm.id ? 'Salvar' : 'Criar tipo'" :loading="salvandoTipo" style="background:var(--primary);color:#fff;border-radius:var(--radius-sm);" @click="salvarTipo" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ─── Dialog novo bloqueio ──────────────────────────────── -->
    <q-dialog v-model="dialogBloqueioAberto" persistent>
      <q-card style="width:420px;max-width:calc(100vw - 32px);background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);">
        <q-card-section style="padding:20px 24px 0;">
          <div class="t-h2">Bloquear horário</div>
        </q-card-section>
        <q-card-section style="padding:16px 24px;display:flex;flex-direction:column;gap:14px;">
          <div class="row q-gutter-sm">
            <div class="col">
              <div class="t-small" style="margin-bottom:6px;font-weight:500;">Início *</div>
              <q-input v-model="bloqueioForm.data_hora_inicio" dense outlined type="datetime-local" />
            </div>
            <div class="col">
              <div class="t-small" style="margin-bottom:6px;font-weight:500;">Fim *</div>
              <q-input v-model="bloqueioForm.data_hora_fim" dense outlined type="datetime-local" />
            </div>
          </div>
          <div>
            <div class="t-small" style="margin-bottom:6px;font-weight:500;">Motivo (opcional)</div>
            <q-input v-model="bloqueioForm.motivo" dense outlined placeholder="Viagem, consulta médica, feriado…" />
          </div>
        </q-card-section>
        <q-card-actions align="right" style="padding:12px 24px 20px;gap:8px;">
          <q-btn class="q-px-sm" flat no-caps label="Cancelar" style="color:var(--text-2);" @click="dialogBloqueioAberto = false" />
          <q-btn class="q-px-sm" unelevated no-caps label="Bloquear" :loading="salvandoBloqueio" style="background:var(--primary);color:#fff;border-radius:var(--radius-sm);" @click="criarBloqueio" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore }            from 'src/stores/authStore'
import { useDisponibilidadeStore } from 'src/stores/disponibilidadeStore'
import { DIAS_SEMANA }             from 'src/constants/dias'
import { ESPECIALIDADES }          from 'src/constants/especialidades'
import { formatarDataHora }        from 'src/utils/helpers'

const $q                  = useQuasar()
const authStore            = useAuthStore()
const disponibilidadeStore = useDisponibilidadeStore()

const secaoAtiva = ref(null)

// TODO(whatsapp-badge): o badge "Conectado" está hardcoded — remover assim que a integração
// com a Evolution API estiver funcionando e ler o status real de authStore.profissional.
const SECOES = [
  { id: 'perfil',      icone: 'manage_accounts', titulo: 'Perfil profissional',     desc: 'Nome, foto, especialidade, bio, registro profissional.' },
  { id: 'whatsapp',    icone: 'mdi-whatsapp',     titulo: 'Conexão WhatsApp',        desc: 'QR Code da Evolution API. Status: conectado.',          badge: 'Conectado' },
  { id: 'horarios',    icone: 'schedule',         titulo: 'Horários disponíveis',    desc: 'Dias da semana, horários, almoço, feriados.' },
  { id: 'tipos',       icone: 'medical_services', titulo: 'Tipos de atendimento',    desc: 'Avaliação 60min · Sessão 50min · Reavaliação 40min.' },
  { id: 'textos',      icone: 'notifications',    titulo: 'Textos automáticos',      desc: 'Personalize confirmação, lembrete 24h, lembrete 2h.' },
  { id: 'cancelamento',icone: 'event_busy',       titulo: 'Política de cancelamento',desc: 'Cancelamento até 4h antes sem custo.' },
]

const CORES_TIPO = ['#6E56CF','#8B76F5','#A78BFA','#8B5CF6','#3B82F6','#10B981','#F59E0B','#EF4444']

// ─── Perfil ──────────────────────────────────────────────────────────────
const salvandoPerfil = ref(false)
const perfil = reactive({
  nome_completo:        '',
  especialidade:        '',
  registro_profissional: '',
  slug:                 '',
  bio:                  '',
  telefone:             '',
})

const salvarPerfil = async () => {
  salvandoPerfil.value = true
  const resultado = await authStore.atualizarPerfilAction({
    dados: {
      nome_completo:        perfil.nome_completo,
      especialidade:        perfil.especialidade,
      slug:                 perfil.slug,
      bio:                  perfil.bio,
      telefone:             perfil.telefone,
      registro_profissional: perfil.registro_profissional,
    },
  })
  salvandoPerfil.value = false
  if (resultado?.sucesso) {
    $q.notify({ type: 'positive', message: 'Perfil atualizado!' })
  } else {
    $q.notify({ type: 'negative', message: resultado?.mensagem || 'Erro ao salvar.' })
  }
}

// ─── Disponibilidades (horários) ─────────────────────────────────────────
const disponibilidadesPorDia = reactive(
  Object.fromEntries(DIAS_SEMANA.map(dia => [
    dia.value,
    { ativo: false, dia_semana: dia.value, hora_inicio: '08:00', hora_fim: '18:00', duracao_slot: 60 }
  ]))
)

const salvarDisponibilidade = async (diaSemana) => {
  const config = disponibilidadesPorDia[diaSemana]
  await disponibilidadeStore.upsertDisponibilidadeAction({
    disponibilidade: {
      dia_semana:   diaSemana,
      ativo:        config.ativo,
      hora_inicio:  config.hora_inicio,
      hora_fim:     config.hora_fim,
      duracao_slot: config.duracao_slot || 60,
    },
  })
}

// ─── Tipos de atendimento ─────────────────────────────────────────────────
const dialogTipoAberto = ref(false)
const salvandoTipo     = ref(false)
const tipoFormVazio    = () => ({ id: null, nome: '', duracao_minutos: 50, valor: null, cor: '#6E56CF' })
const tipoForm         = reactive(tipoFormVazio())

const abrirDialogTipo = (tipo) => {
  if (tipo) {
    Object.assign(tipoForm, { ...tipoFormVazio(), ...tipo })
  } else {
    Object.assign(tipoForm, tipoFormVazio())
  }
  dialogTipoAberto.value = true
}

const salvarTipo = async () => {
  if (!tipoForm.nome || !tipoForm.duracao_minutos) {
    $q.notify({ type: 'negative', message: 'Nome e duração são obrigatórios.' })
    return
  }
  salvandoTipo.value = true
  let resultado
  if (tipoForm.id) {
    resultado = await disponibilidadeStore.putTipoAtendimentoAction({
      tipo: { ...tipoForm },
    })
  } else {
    resultado = await disponibilidadeStore.postTipoAtendimentoAction({
      tipo: { nome: tipoForm.nome, duracao_minutos: tipoForm.duracao_minutos, valor: tipoForm.valor, cor: tipoForm.cor },
    })
  }
  salvandoTipo.value = false
  if (resultado.sucesso) {
    $q.notify({ type: 'positive', message: tipoForm.id ? 'Tipo atualizado!' : 'Tipo criado!' })
    dialogTipoAberto.value = false
  } else {
    $q.notify({ type: 'negative', message: resultado.mensagem })
  }
}

const desativarTipo = (tipo) => {
  $q.dialog({
    title: 'Desativar tipo',
    message: `Desativar "${tipo.nome}"? Agendamentos anteriores não serão afetados.`,
    cancel: { flat: true, label: 'Cancelar' },
    ok: { label: 'Desativar', flat: true, color: 'negative' },
  }).onOk(async () => {
    await disponibilidadeStore.deleteTipoAtendimentoAction({ tipo })
  })
}

// ─── Bloqueios ────────────────────────────────────────────────────────────
const dialogBloqueioAberto = ref(false)
const salvandoBloqueio     = ref(false)
const bloqueioForm         = reactive({ data_hora_inicio: '', data_hora_fim: '', motivo: '' })

const criarBloqueio = async () => {
  if (!bloqueioForm.data_hora_inicio || !bloqueioForm.data_hora_fim) {
    $q.notify({ type: 'negative', message: 'Informe início e fim do bloqueio.' })
    return
  }
  salvandoBloqueio.value = true
  const resultado = await disponibilidadeStore.postBloqueioAction({
    bloqueio: {
      data_hora_inicio: new Date(bloqueioForm.data_hora_inicio).toISOString(),
      data_hora_fim:    new Date(bloqueioForm.data_hora_fim).toISOString(),
      motivo:           bloqueioForm.motivo || null,
    },
  })
  salvandoBloqueio.value = false
  if (resultado.sucesso) {
    $q.notify({ type: 'positive', message: 'Horário bloqueado.' })
    dialogBloqueioAberto.value = false
    Object.assign(bloqueioForm, { data_hora_inicio: '', data_hora_fim: '', motivo: '' })
  }
}

const removerBloqueio = async (bloqueio) => {
  $q.dialog({
    title: 'Remover bloqueio',
    message: 'Confirma a remoção deste bloqueio?',
    cancel: { flat: true, label: 'Cancelar' },
    ok: { label: 'Remover', flat: true, color: 'negative' },
  }).onOk(async () => {
    await disponibilidadeStore.deleteBloqueioAction({ bloqueio })
    $q.notify({ type: 'positive', message: 'Bloqueio removido.' })
  })
}

watch(() => authStore.profissionalId, async (id) => {
  if (!id) return

  const profissional = authStore.profissional || {}
  Object.assign(perfil, {
    nome_completo:         authStore.nomeCompleto || '',
    especialidade:         profissional.especialidade || '',
    registro_profissional: profissional.registro_profissional || '',
    slug:                  profissional.slug || '',
    bio:                   profissional.bio || '',
    telefone:              profissional.telefone || '',
  })

  await Promise.all([
    disponibilidadeStore.setListDisponibilidadesAction(),
    disponibilidadeStore.setListTiposAtendimentoAction(),
    disponibilidadeStore.setListBloqueiosAction(),
  ])

  disponibilidadeStore.lista_disponibilidades.forEach(disp => {
    if (disponibilidadesPorDia[disp.dia_semana] !== undefined) {
      Object.assign(disponibilidadesPorDia[disp.dia_semana], {
        id:           disp.id,
        ativo:        disp.ativo,
        hora_inicio:  disp.hora_inicio,
        hora_fim:     disp.hora_fim,
        duracao_slot: disp.duracao_slot || 60,
      })
    }
  })
}, { immediate: true })
</script>
