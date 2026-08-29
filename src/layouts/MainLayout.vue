<template>
  <q-layout view="hHh LpR lff">

    <!-- ─── Header ────────────────────────────────────────────────── -->
    <q-header style="background:var(--bg-2);border-bottom:1px solid var(--border);box-shadow:none;">
      <q-toolbar style="height:52px;min-height:52px;padding:0 12px 0 16px;">

        <!-- Toggle sidebar -->
        <q-btn class="q-px-sm"
          flat round dense
          icon="menu"
          @click="alternarSidebar"
          style="color:var(--text-2);margin-right:4px;"
        />

        <!-- Logo visível apenas no mobile (sidebar oculta) -->
        <transition name="fade">
          <div
            v-show="$q.screen.lt.md"
            style="display:flex;align-items:center;gap:8px;margin-left:4px;"
          >
            <span style="width:24px;height:24px;border-radius:6px;background:var(--primary);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;flex-shrink:0;">A</span>
            <span style="font-size:14px;font-weight:600;letter-spacing:-0.01em;color:var(--text);">Atende</span>
          </div>
        </transition>

        <q-space />

        <!-- Status WhatsApp -->
        <div
          style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;margin-right:4px;cursor:pointer;"
          :style="whatsappConectado ? 'background:rgba(22,163,74,0.1);' : 'background:rgba(239,68,68,0.1);'"
          @click="irParaConfiguracoes"
        >
          <q-icon name="mdi-whatsapp" size="14px" :style="whatsappConectado ? 'color:#16a34a;' : 'color:#ef4444;'" />
          <span style="font-size:11.5px;font-weight:500;" :style="whatsappConectado ? 'color:#16a34a;' : 'color:#ef4444;'">
            {{ whatsappConectado ? 'Conectado' : 'Desconectado' }}
          </span>
        </div>

        <!-- Notificações -->
        <q-btn class="q-px-sm" flat round dense icon="notifications_none" style="color:var(--text-2);" />

        <!-- Toggle dark mode -->
        <q-btn class="q-px-sm"
          flat round dense
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          @click="$q.dark.toggle()"
          style="color:var(--text-2);margin-right:4px;"
        />

        <!-- Usuário + dropdown -->
        <q-btn class="q-px-sm" flat dense no-caps padding="4px 8px" style="border-radius:var(--radius-sm);">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="av" style="width:28px;height:28px;font-size:11px;">{{ iniciais }}</span>
            <div v-if="!$q.screen.lt.sm" style="text-align:left;line-height:1.25;">
              <div style="font-size:13px;font-weight:500;color:var(--text);">{{ authStore.primeiroNome }}</div>
              <div style="font-size:11px;color:var(--text-3);">{{ authStore.profissional?.especialidade }}</div>
            </div>
            <q-icon name="expand_more" size="14px" style="color:var(--text-3);" />
          </div>

          <q-menu anchor="bottom right" self="top right" :offset="[0, 6]" style="min-width:180px;border:1px solid var(--border);border-radius:var(--radius);background:var(--card);box-shadow:0 4px 16px rgba(0,0,0,.12);">
            <div style="padding:4px;">
              <div style="padding:10px 12px 8px;">
                <div style="font-size:12.5px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ authStore.nomeCompleto }}</div>
                <div style="font-size:11px;color:var(--text-3);margin-top:2px;">{{ authStore.profissional?.especialidade }}</div>
              </div>
              <div style="height:1px;background:var(--border);margin:2px 0;" />
              <button class="sidebar-nav-item" style="padding:9px 12px;height:auto;" @click="irParaConfiguracoes">
                <q-icon name="settings" size="15px" class="icon" /> Configurações
              </button>
              <div style="height:1px;background:var(--border);margin:2px 0;" />
              <button class="sidebar-nav-item" style="padding:9px 12px;height:auto;" @click="sair">
                <q-icon name="logout" size="15px" style="color:var(--status-falta);" />
                <span style="color:var(--status-falta);">Sair</span>
              </button>
            </div>
          </q-menu>
        </q-btn>

      </q-toolbar>
    </q-header>

    <!-- ─── Sidebar ───────────────────────────────────────────────── -->
    <q-drawer
      v-model="sidebarAberta"
      show-if-above
      :width="sidebarMini ? 56 : 232"
      :breakpoint="768"
      style="background:var(--bg-2);border-right:1px solid var(--border);"
    >
      <div style="display:flex;flex-direction:column;height:100%;overflow:hidden;">

        <!-- Logo: sempre visível, texto some quando mini -->
        <div
          :style="sidebarMini
            ? 'padding:18px 0 14px;display:flex;align-items:center;justify-content:center;'
            : 'padding:18px 16px 14px;display:flex;align-items:center;justify-content:space-between;'"
        >
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="width:28px;height:28px;border-radius:8px;background:var(--primary);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;letter-spacing:-0.02em;flex-shrink:0;">A</span>
            <span v-show="!sidebarMini" style="font-size:15px;font-weight:600;letter-spacing:-0.01em;color:var(--text);white-space:nowrap;">Atende</span>
          </div>
        </div>

        <!-- Novo agendamento -->
        <div :style="sidebarMini ? 'padding:4px 8px 12px;display:flex;justify-content:center;' : 'padding:4px 12px 12px;'">
          <q-btn
            v-if="!sidebarMini"
            unelevated no-caps class="full-width q-px-sm"
            style="height:34px;font-size:13px;background:var(--primary);color:#fff;border-radius:var(--radius-sm);"
            icon="add"
            label="Novo agendamento"
            @click="$router.push({ name: 'agenda' })"
          />
          <q-btn class="q-px-sm"
            v-else
            unelevated round dense
            icon="add"
            style="width:36px;height:36px;background:var(--primary);color:#fff;"
            @click="$router.push({ name: 'agenda' })"
          >
            <q-tooltip anchor="center right" self="center left" :offset="[8,0]">Novo agendamento</q-tooltip>
          </q-btn>
        </div>

        <!-- Nav -->
        <nav
          :style="sidebarMini
            ? 'padding:8px;flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;'
            : 'padding:8px;flex:1;display:flex;flex-direction:column;gap:1px;'"
        >
          <div v-show="!sidebarMini" class="t-tiny" style="padding:4px 10px 8px;">Geral</div>

          <!-- Modo expandido -->
          <template v-if="!sidebarMini">
            <button
              v-for="item in itensMenu"
              :key="item.rota"
              class="sidebar-nav-item"
              :class="{ active: rotaAtiva === item.rota }"
              @click="$router.push({ name: item.rota })"
            >
              <q-icon :name="item.icone" size="17px" class="icon" />
              {{ item.label }}
            </button>
          </template>

          <!-- Modo mini (ícones centrados com tooltip) -->
          <template v-else>
            <q-btn class="q-px-sm"
              v-for="item in itensMenu"
              :key="item.rota"
              flat dense
              :icon="item.icone"
              style="width:40px;height:40px;border-radius:var(--radius-sm);"
              :style="rotaAtiva === item.rota
                ? 'background:var(--card);color:var(--primary);'
                : 'color:var(--text-2);'"
              @click="$router.push({ name: item.rota })"
            >
              <q-tooltip anchor="center right" self="center left" :offset="[8,0]">{{ item.label }}</q-tooltip>
            </q-btn>
          </template>
        </nav>

        <!-- Perfil (apenas em modo expandido) -->
        <div v-show="!sidebarMini" style="padding:10px;border-top:1px solid var(--border);">
          <div class="row-hover" style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--radius-sm);cursor:pointer;">
            <span class="av" style="width:28px;height:28px;font-size:11px;">{{ iniciais }}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text);">{{ authStore.nomeCompleto }}</div>
              <div style="font-size:11.5px;color:var(--text-3);">{{ authStore.profissional?.especialidade }}</div>
            </div>
          </div>
        </div>

      </div>
    </q-drawer>

    <!-- ─── Conteúdo ───────────────────────────────────────────────── -->
    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from 'src/stores/authStore'
import { useQuasar } from 'quasar'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const $q        = useQuasar()

const sidebarAberta = ref(true)
const sidebarMini   = ref(false)

const itensMenu = [
  { label: 'Dashboard',     rota: 'dashboard',    icone: 'space_dashboard' },
  { label: 'Agenda',        rota: 'agenda',        icone: 'calendar_month' },
  { label: 'Pacientes',     rota: 'pacientes',     icone: 'group' },
  { label: 'Configurações', rota: 'configuracoes', icone: 'settings' },
]

const rotaAtiva = computed(() => route.name)

const whatsappConectado = computed(() => !!authStore.profissional?.whatsapp_conectado)

const iniciais = computed(() => {
  const nome = authStore.nomeCompleto || ''
  return nome.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase() || 'U'
})

const alternarSidebar = () => {
  if ($q.screen.lt.md) {
    sidebarAberta.value = !sidebarAberta.value
  } else {
    sidebarMini.value = !sidebarMini.value
  }
}

const irParaConfiguracoes = () => {
  router.push({ name: 'configuracoes' })
}

const sair = async () => {
  await authStore.logoutAction()
  router.push({ name: 'login' })
}
</script>
