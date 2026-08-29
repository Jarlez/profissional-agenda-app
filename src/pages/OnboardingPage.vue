<template>
  <div style="min-height:100vh;background:var(--bg);display:flex;align-items:center;justify-content:center;padding:24px;">
    <div style="width:100%;max-width:580px;">

      <!-- Logo + progresso -->
      <div style="text-align:center;margin-bottom:28px;">
        <span style="width:36px;height:36px;border-radius:10px;background:var(--primary);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;letter-spacing:-0.02em;">A</span>
        <div style="display:flex;justify-content:center;gap:6px;margin-top:16px;">
          <div v-for="n in 3" :key="n" style="height:4px;width:48px;border-radius:2px;transition:background 300ms;" :style="n <= passo ? 'background:var(--primary);' : 'background:var(--border);'"></div>
        </div>
        <div class="t-small" style="margin-top:8px;">Passo {{ passo }} de 3</div>
      </div>

      <!-- Card do wizard -->
      <div class="atende-card" style="padding:32px;">

        <!-- ── Passo 1: Horários ─────────────────────────────── -->
        <div v-if="passo === 1">
          <div class="t-h2" style="margin-bottom:6px;">Configure seus horários</div>
          <div class="t-small" style="margin-bottom:24px;">Escolha os dias e horários em que você atende. Você pode ajustar depois em Configurações.</div>

          <div style="display:flex;flex-direction:column;gap:10px;">
            <div
              v-for="dia in DIAS_SEMANA_UTEIS"
              :key="dia.value"
              class="atende-card"
              style="padding:12px 16px;display:grid;grid-template-columns:140px auto 1fr;gap:12px;align-items:center;"
            >
              <div style="font-size:13.5px;font-weight:500;color:var(--text);">{{ dia.label }}</div>
              <q-toggle v-model="horarios[dia.value].ativo" color="primary" dense />
              <div v-if="horarios[dia.value].ativo" style="display:flex;align-items:center;gap:8px;">
                <q-input v-model="horarios[dia.value].hora_inicio" type="time" dense outlined style="width:100px;" />
                <span class="t-small">às</span>
                <q-input v-model="horarios[dia.value].hora_fim" type="time" dense outlined style="width:100px;" />
              </div>
              <div v-else class="t-small" style="color:var(--text-3);">Não atendo</div>
            </div>
          </div>
        </div>

        <!-- ── Passo 2: WhatsApp ─────────────────────────────── -->
        <div v-if="passo === 2" style="text-align:center;">
          <div style="width:56px;height:56px;border-radius:14px;background:var(--primary-soft);color:var(--primary-text);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
            <q-icon name="mdi-whatsapp" size="28px"/>
          </div>
          <div class="t-h2" style="margin-bottom:6px;">Conecte o WhatsApp</div>
          <div class="t-small" style="margin-bottom:24px;max-width:400px;margin-left:auto;margin-right:auto;">O Atende envia lembretes automáticos pelos seu WhatsApp. Configure em Configurações → Conexão WhatsApp quando estiver pronto.</div>

          <div style="background:var(--card-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px;">
            <div style="width:160px;height:160px;background:var(--border);border-radius:8px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
              <q-icon name="qr_code_2" size="80px" style="color:var(--text-3);" />
            </div>
            <div class="t-small">QR Code disponível em Configurações → Conexão WhatsApp</div>
          </div>

          <q-btn
            class="q-px-sm"
            unelevated no-caps
            label="Conectar depois"
            style="background:var(--card-2);color:var(--text-2);border:1px solid var(--border);border-radius:var(--radius-sm);"
            @click="avancar"
          />
        </div>

        <!-- ── Passo 3: Link público ──────────────────────────── -->
        <div v-if="passo === 3" style="text-align:center;">
          <div style="width:56px;height:56px;border-radius:14px;background:var(--primary-soft);color:var(--primary-text);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
            <q-icon name="link" size="28px"/>
          </div>
          <div class="t-h2" style="margin-bottom:6px;">Seu link de agendamento</div>
          <div class="t-small" style="margin-bottom:24px;">Compartilhe este link no Instagram, WhatsApp e cartão de visita. Seus pacientes agendam direto, sem precisar de conta.</div>

          <div style="background:var(--card-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;margin-bottom:20px;">
            <div style="font-size:13px;color:var(--text-3);margin-bottom:8px;">Seu link público</div>
            <div style="font-size:16px;font-weight:600;color:var(--text);margin-bottom:16px;word-break:break-all;">
              atende.app/{{ authStore.slugProfissional || 'seu-slug' }}
            </div>
            <q-btn
              class="q-px-sm"
              unelevated no-caps
              icon="content_copy"
              label="Copiar link"
              style="background:var(--primary);color:#fff;border-radius:var(--radius-sm);"
              @click="copiarLink"
            />
            <div v-if="copiado" class="t-small" style="margin-top:8px;color:var(--status-confirmado);">✓ Link copiado!</div>
          </div>
        </div>

      </div>

      <!-- Navegação -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;">
        <button
          v-if="passo < 3"
          style="background:transparent;border:0;color:var(--text-3);font-size:13px;cursor:pointer;font-family:inherit;padding:8px;"
          @click="pular"
        >
          Configurar depois
        </button>
        <div v-else></div>

        <q-btn
          class="q-px-sm"
          unelevated no-caps
          :label="passo === 3 ? 'Ir para o dashboard →' : 'Continuar'"
          :loading="salvando"
          style="background:var(--primary);color:#fff;border-radius:var(--radius-sm);"
          @click="avancar"
        />
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore }            from 'src/stores/authStore'
import { useDisponibilidadeStore } from 'src/stores/disponibilidadeStore'

const router               = useRouter()
const $q                   = useQuasar()
const authStore            = useAuthStore()
const disponibilidadeStore = useDisponibilidadeStore()

const passo   = ref(1)
const salvando = ref(false)
const copiado = ref(false)

const DIAS_SEMANA_UTEIS = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

const horarios = reactive(
  Object.fromEntries(
    DIAS_SEMANA_UTEIS.map(d => [
      d.value,
      { ativo: d.value >= 1 && d.value <= 5, hora_inicio: '08:00', hora_fim: '18:00' },
    ])
  )
)

const salvarHorarios = async () => {
  const promises = DIAS_SEMANA_UTEIS.map(d =>
    disponibilidadeStore.upsertDisponibilidadeAction({
      disponibilidade: {
        dia_semana:  d.value,
        ativo:       horarios[d.value].ativo,
        hora_inicio: horarios[d.value].hora_inicio,
        hora_fim:    horarios[d.value].hora_fim,
        duracao_slot: 60,
      },
    })
  )
  await Promise.all(promises)
}

const marcarConcluido = () => {
  const userId = authStore.usuario?.id
  if (userId) localStorage.setItem(`onboarding_done_${userId}`, '1')
}

const avancar = async () => {
  if (passo.value === 1) {
    salvando.value = true
    await salvarHorarios()
    salvando.value = false
    passo.value = 2
  } else if (passo.value === 2) {
    passo.value = 3
  } else {
    marcarConcluido()
    router.push({ name: 'dashboard' })
  }
}

const pular = () => {
  marcarConcluido()
  router.push({ name: 'dashboard' })
}

const copiarLink = () => {
  const link = `atende.app/${authStore.slugProfissional || ''}`
  navigator.clipboard.writeText(link).then(() => {
    copiado.value = true
    setTimeout(() => { copiado.value = false }, 2500)
  })
}
</script>
