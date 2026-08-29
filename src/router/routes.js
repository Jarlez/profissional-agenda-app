const rotas = [
  // ─── Rotas públicas (sem autenticação) ────────────────────────────────
  {
    path: '/login',
    component: () => import('src/layouts/PublicLayout.vue'),
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('src/pages/auth/LoginPage.vue'),
      },
    ],
  },
  {
    path: '/cadastro',
    component: () => import('src/layouts/PublicLayout.vue'),
    children: [
      {
        path: '',
        name: 'cadastro',
        component: () => import('src/pages/auth/CadastroPage.vue'),
      },
    ],
  },

  // ─── Página pública de agendamento (acessada pelo paciente) ──────────
  {
    path: '/agendar/:slug',
    name: 'agendamento-publico',
    component: () => import('src/pages/public/AgendamentoPublicoPage.vue'),
  },

  // ─── Onboarding (autenticado, sem sidebar) ───────────────────────────
  {
    path: '/onboarding',
    component: () => import('src/layouts/PublicLayout.vue'),
    meta: { requerAuth: true },
    children: [
      {
        path: '',
        name: 'onboarding',
        component: () => import('src/pages/OnboardingPage.vue'),
      },
    ],
  },

  // ─── App autenticado ──────────────────────────────────────────────────
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    meta: { requerAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('src/pages/DashboardPage.vue'),
      },
      {
        path: 'agenda',
        name: 'agenda',
        component: () => import('src/pages/AgendaPage.vue'),
      },
      {
        path: 'pacientes',
        name: 'pacientes',
        component: () => import('src/pages/PacientesPage.vue'),
      },
      {
        path: 'pacientes/:id',
        name: 'paciente-detalhe',
        component: () => import('src/pages/PacienteDetalhePage.vue'),
      },
      {
        path: 'configuracoes',
        name: 'configuracoes',
        component: () => import('src/pages/ConfiguracoesPage.vue'),
      },
    ],
  },

  // ─── 404 ──────────────────────────────────────────────────────────────
  {
    path: '/:catchAll(.*)*',
    component: () => import('src/pages/ErrorNotFoundPage.vue'),
  },
]

export default rotas
