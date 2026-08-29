<template>
  <div class="auth-bg">
    <div class="auth-wrap fade-in">

      <!-- Logo -->
      <div class="auth-logo">
        <span class="auth-badge">A</span>
        <div>
          <div class="auth-logo-title">Criar conta no Atende</div>
          <div class="t-small" style="margin-top:4px">30 dias grátis, sem cartão de crédito</div>
        </div>
      </div>

      <!-- Card -->
      <div class="atende-card auth-card">

        <!-- Tabs -->
        <div class="auth-tabs">
          <router-link :to="{ name: 'login' }">Entrar</router-link>
          <router-link :to="{ name: 'cadastro' }">Criar conta</router-link>
        </div>

        <!-- Estado: email enviado para confirmação -->
        <template v-if="aguardandoConfirmacao">
          <div class="auth-confirm">
            <div class="auth-confirm-icon">📬</div>
            <div class="t-h3" style="margin-bottom:8px">Confirme seu e-mail</div>
            <div class="t-small">
              Enviamos um link de confirmação para <strong>{{ formulario.email }}</strong>.
              Verifique sua caixa de entrada e clique no link para ativar sua conta.
            </div>
            <div style="margin-top:20px">
              <router-link :to="{ name: 'login' }" class="auth-link-sm" style="font-size:13px">
                Voltar para o login
              </router-link>
            </div>
          </div>
        </template>

        <!-- Formulário de cadastro -->
        <template v-else>

          <!-- Google -->
          <button class="auth-btn-google" @click="loginGoogle" :disabled="authStore.carregando">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>

          <!-- Divider -->
          <div class="auth-divider">
            <span class="auth-divider-line" />
            <span class="t-small" style="font-size:11.5px;white-space:nowrap">ou com e-mail</span>
            <span class="auth-divider-line" />
          </div>

          <!-- Form -->
          <form @submit.prevent="cadastrar" style="display:flex;flex-direction:column;gap:12px">
            <div class="auth-field">
              <label class="auth-label">Nome completo</label>
              <input
                class="auth-input"
                type="text"
                v-model="formulario.nome_completo"
                placeholder="Seu nome"
                autocomplete="name"
                minlength="5"
                required
              />
            </div>

            <div class="auth-field">
              <label class="auth-label">Especialidade</label>
              <select class="auth-select" v-model="formulario.especialidade">
                <option value="fisioterapia">Fisioterapia</option>
                <option value="nutricao">Nutrição</option>
                <option value="personal_trainer">Personal Trainer</option>
                <option value="outra">Outra</option>
              </select>
            </div>

            <div class="auth-field">
              <label class="auth-label">E-mail profissional</label>
              <input
                class="auth-input"
                type="email"
                v-model="formulario.email"
                placeholder="voce@exemplo.com"
                autocomplete="email"
                required
              />
            </div>

            <div class="auth-field">
              <label class="auth-label">Senha</label>
              <div class="auth-input-wrap">
                <input
                  class="auth-input"
                  :type="mostrarSenha ? 'text' : 'password'"
                  v-model="formulario.senha"
                  placeholder="Mínimo 6 caracteres"
                  autocomplete="new-password"
                  minlength="6"
                  required
                />
                <button type="button" class="auth-eye" @click="mostrarSenha = !mostrarSenha" tabindex="-1">
                  <q-icon :name="mostrarSenha ? 'visibility_off' : 'visibility'" size="16px" />
                </button>
              </div>
            </div>

            <button class="auth-btn-primary" type="submit" :disabled="authStore.carregando">
              <q-spinner v-if="authStore.carregando" size="14px" color="white" />
              <span v-else>Criar conta grátis</span>
            </button>
          </form>

        </template>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/authStore'
import { useQuasar } from 'quasar'

const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()

const formulario = ref({
  nome_completo: '',
  especialidade: 'fisioterapia',
  email: '',
  senha: '',
})

const mostrarSenha = ref(false)
const aguardandoConfirmacao = ref(false)

const cadastrar = async () => {
  const resultado = await authStore.cadastrarAction(formulario.value)

  if (!resultado.sucesso) {
    $q.notify({ type: 'negative', message: resultado.mensagem })
    return
  }

  if (resultado.mensagem === 'confirmar_email') {
    aguardandoConfirmacao.value = true
    return
  }

  $q.notify({ type: 'positive', message: 'Conta criada! Bem-vindo(a).' })
  router.push({ name: 'dashboard' })
}

const loginGoogle = async () => {
  const resultado = await authStore.loginGoogleAction()
  if (!resultado.sucesso) {
    $q.notify({ type: 'negative', message: resultado.mensagem })
  }
}
</script>
