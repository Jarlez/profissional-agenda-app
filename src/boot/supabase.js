import { boot } from 'quasar/wrappers'
import { supabase } from 'src/services/supabase'
import { useAuthStore } from 'src/stores/authStore'
import pinia from 'src/stores'

export default boot(async ({ app }) => {
  app.config.globalProperties.$supabase = supabase

  // Pinia já foi instalado pelo boot/pinia.js — passamos a instância explicitamente
  const authStore = useAuthStore(pinia)
  await authStore.iniciarSessaoAction()

  // Listener de mudança de estado de autenticação
  supabase.auth.onAuthStateChange((evento, sessao) => {
    authStore.setarSessaoAction({ sessao, evento })
  })
})
