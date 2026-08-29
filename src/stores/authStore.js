import { defineStore } from 'pinia'
import { supabase } from 'src/services/supabase'

export const useAuthStore = defineStore('Auth', {
  state: () => ({
    sessao: null,
    usuario: null,
    profissional: null,
    carregando: false,
  }),

  getters: {
    estaAutenticado: (state) => !!state.sessao,
    profissionalId: (state) => state.profissional?.id ?? null,
    slugProfissional: (state) => state.profissional?.slug ?? null,
    nomeCompleto: (state) => state.profissional?.nome_completo ?? '',
    primeiroNome: (state) => {
      const nome = state.profissional?.nome_completo ?? ''
      return nome.split(' ')[0]
    },
  },

  actions: {
    async iniciarSessaoAction() {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        this.sessao = data.session
        this.usuario = data.session.user
        await this.carregarPerfilAction()
      }
    },

    async setarSessaoAction({ sessao, evento }) {
      this.sessao = sessao
      this.usuario = sessao?.user ?? null

      if (evento === 'SIGNED_IN' && sessao) {
        await this.carregarPerfilAction()
      }

      if (evento === 'SIGNED_OUT') {
        this.profissional = null
      }
    },

    async carregarPerfilAction() {
      if (!this.usuario?.id) return

      const { data, error } = await supabase
        .from('profissionais')
        .select('*')
        .eq('user_id', this.usuario.id)
        .maybeSingle()

      if (error) {
        console.error('[Auth] Erro ao carregar perfil:', error.message)
        return
      }

      if (!data) {
        // Perfil ainda não existe — cria a partir dos metadados do usuário
        const nome_completo =
          this.usuario.user_metadata?.nome_completo ||
          this.usuario.email.split('@')[0]
        const slug = gerarSlugUnico(nome_completo)

        const { data: novoPerfil, error: erroPerfil } = await supabase
          .from('profissionais')
          .insert({ user_id: this.usuario.id, nome_completo, slug })
          .select()
          .single()

        if (erroPerfil) {
          console.error('[Auth] Erro ao criar perfil automático:', erroPerfil.message)
          return
        }

        this.profissional = novoPerfil
        return
      }

      this.profissional = data
    },

    async loginAction(obj) {
      const resultado = { sucesso: false, retorno: null, mensagem: '', status_code: null }
      this.carregando = true

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: obj.email,
          password: obj.senha,
        })

        if (error) {
          resultado.mensagem = traduzirErroAuth(error.message)
          resultado.status_code = error.status
        } else {
          resultado.sucesso = true
          resultado.retorno = data.user
          resultado.mensagem = 'Login realizado com sucesso!'
        }
      } catch (erro) {
        resultado.mensagem = 'Erro inesperado. Tente novamente.'
        console.error('[Auth] loginAction:', erro)
      }

      this.carregando = false
      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    async loginGoogleAction() {
      const resultado = { sucesso: false, retorno: null, mensagem: '' }

      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/dashboard` },
        })

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao conectar com Google.'
        console.error('[Auth] loginGoogleAction:', erro)
      }

      return resultado
    },

    async cadastrarAction(obj) {
      const resultado = { sucesso: false, retorno: null, mensagem: '', status_code: null }
      this.carregando = true

      try {
        const { data, error } = await supabase.auth.signUp({
          email: obj.email,
          password: obj.senha,
          options: {
            data: { nome_completo: obj.nome_completo },
          },
        })

        if (error) {
          resultado.mensagem = traduzirErroAuth(error.message)
          resultado.status_code = error.status
          this.carregando = false
          if (obj?.callback) obj.callback(resultado)
          return resultado
        }

        // Email já cadastrado — Supabase retorna fake success com identities vazio
        if (data.user?.identities?.length === 0) {
          resultado.mensagem = 'Este e-mail já está cadastrado.'
          this.carregando = false
          if (obj?.callback) obj.callback(resultado)
          return resultado
        }

        // Email de confirmação enviado — sem sessão ativa ainda
        if (!data.session) {
          resultado.sucesso = true
          resultado.mensagem = 'confirmar_email'
          this.carregando = false
          if (obj?.callback) obj.callback(resultado)
          return resultado
        }

        // Sessão ativa (confirmação desabilitada no projeto Supabase) → cria perfil agora
        if (data.user) {
          const slug = gerarSlugUnico(obj.nome_completo)

          const { error: erroProfile } = await supabase.from('profissionais').insert({
            user_id: data.user.id,
            nome_completo: obj.nome_completo,
            especialidade: obj.especialidade ?? null,
            slug,
          })

          if (erroProfile) {
            console.error('[Auth] Erro ao criar perfil:', erroProfile.message)
          }
        }

        resultado.sucesso = true
        resultado.retorno = data.user
        resultado.mensagem = 'Conta criada com sucesso!'
      } catch (erro) {
        resultado.mensagem = 'Erro inesperado ao criar conta.'
        console.error('[Auth] cadastrarAction:', erro)
      }

      this.carregando = false
      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    async resetSenhaAction(obj) {
      const resultado = { sucesso: false, mensagem: '' }
      this.carregando = true

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(obj.email, {
          redirectTo: `${window.location.origin}/nova-senha`,
        })

        if (error) {
          resultado.mensagem = traduzirErroAuth(error.message)
        } else {
          resultado.sucesso = true
          resultado.mensagem = 'Link enviado! Verifique sua caixa de entrada.'
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao enviar e-mail. Tente novamente.'
        console.error('[Auth] resetSenhaAction:', erro)
      }

      this.carregando = false
      if (obj?.callback) obj.callback(resultado)
      return resultado
    },

    async logoutAction() {
      await supabase.auth.signOut()
      this.sessao = null
      this.usuario = null
      this.profissional = null
    },

    async atualizarPerfilAction(obj) {
      const resultado = { sucesso: false, retorno: null, mensagem: '' }

      try {
        const { data, error } = await supabase
          .from('profissionais')
          .update(obj.dados)
          .eq('id', this.profissionalId)
          .select()
          .single()

        if (error) {
          resultado.mensagem = error.message
        } else {
          resultado.sucesso = true
          resultado.retorno = data
          this.profissional = data
          resultado.mensagem = 'Perfil atualizado!'
        }
      } catch (erro) {
        resultado.mensagem = 'Erro ao atualizar perfil.'
        console.error('[Auth] atualizarPerfilAction:', erro)
      }

      if (obj?.callback) obj.callback(resultado)
      return resultado
    },
  },
})

// ─── Helpers internos ─────────────────────────────────────────────────────

const traduzirErroAuth = (mensagem) => {
  const erros = {
    'Invalid login credentials': 'E-mail ou senha incorretos.',
    'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
    'User already registered': 'Este e-mail já está cadastrado.',
    'Password should be at least 6 characters': 'A senha deve ter ao menos 6 caracteres.',
    'Unable to validate email address: invalid format': 'Formato de e-mail inválido.',
  }
  return erros[mensagem] ?? mensagem
}

const gerarSlugUnico = (nome) => {
  const base = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')

  const sufixo = Math.random().toString(36).substring(2, 6)
  return `${base}-${sufixo}`
}
