import { route } from 'quasar/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import rotas from './routes'
import { useAuthStore } from 'src/stores/authStore'

export default route(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes: rotas,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // Guard global: protege rotas que requerem autenticação
  router.beforeEach((para, _de, proximo) => {
    const authStore = useAuthStore()

    if (para.meta.requerAuth && !authStore.estaAutenticado) {
      return proximo({ name: 'login', query: { redirect: para.fullPath } })
    }

    // Redireciona usuário autenticado que tenta acessar login/cadastro
    if ((para.name === 'login' || para.name === 'cadastro') && authStore.estaAutenticado) {
      return proximo({ name: 'dashboard' })
    }

    // TODO(onboarding): esta flag hoje vive em localStorage, ou seja, se o usuário limpar
    // o cache do navegador ou trocar de dispositivo, o onboarding aparece de novo.
    // O correto é adicionar uma coluna `onboarding_concluido boolean` em `profissionais`
    // (nova migration) e usar `authStore.profissional?.onboarding_concluido` aqui e em
    // `marcarConcluido()` na OnboardingPage.vue.
    if (para.meta.requerAuth && authStore.estaAutenticado && para.name !== 'onboarding') {
      const userId = authStore.usuario?.id
      if (userId && !localStorage.getItem(`onboarding_done_${userId}`)) {
        return proximo({ name: 'onboarding' })
      }
    }

    return proximo()
  })

  return router
})
