# Backlog técnico

Itens levantados na revisão de código mas ainda **não implementados**.
Rodar quando houver tempo. Não são bugs bloqueantes — são melhorias de
robustez que vão evitar dor de cabeça no futuro.

---

## Bloco 4 — Segurança e robustez pontual (pendente)

### 1. Validar tamanho e MIME antes de upload de anexos

- **Arquivo:** `src/composables/useAnexos.js`
- **Problema:** hoje qualquer arquivo (qualquer tipo, qualquer tamanho) é
  aceito. Um usuário pode enviar um `.exe` de 500 MB e o Supabase Storage vai
  aceitar até estourar cota.
- **O que fazer:**
  - Definir constantes: `TAMANHO_MAX_MB = 20`, `TIPOS_PERMITIDOS = ['image/*', 'application/pdf', 'audio/*']`.
  - Antes de `supabase.storage.from('anexos').upload(...)`, rejeitar com mensagem
    amigável se não bater.
  - Refletir a validação na UI de `PacienteDetalhePage.vue` (o texto "sem limite
    de tipo" some, aparece "PDF, imagens, áudios — até 20 MB").
- **Bônus:** validar também no bucket via política do Supabase Storage
  (`file_size_limit` e `allowed_mime_types`), para não depender do front.

### 2. Slug único garantido no cadastro

- **Arquivo:** `src/stores/authStore.js` (`gerarSlugUnico()`, linha ~277)
- **Problema:** hoje o slug é `nome-sufixo` onde o sufixo é
  `Math.random().toString(36).substring(2, 6)`. Se dois "João Silva" se
  cadastrarem simultaneamente e o random der o mesmo sufixo (baixa mas real),
  o segundo cadastro quebra silenciosamente por causa do `UNIQUE` da tabela.
- **Opções (em ordem de preferência):**
  1. **Trigger Postgres:** gerar o slug no `BEFORE INSERT` da tabela
     `profissionais` usando uma função que checa colisão e adiciona
     sufixo incremental. É a mais robusta.
  2. **Loop de retry no front:** gerar, tentar inserir, se der `duplicate key`
     regenerar e tentar de novo até 3 tentativas.
  3. **Validar antes de inserir:** `SELECT COUNT(*) WHERE slug = ...` seguido
     de retry. Suscetível a race condition entre 2 usuários, então pior que a 1.

### 3. Cleanup do timer no Dashboard

- **Arquivo:** `src/pages/DashboardPage.vue`
- **Problema:** `timerAgora = setInterval(..., 30_000)` (linha ~378) nunca é
  limpo no `onUnmounted`. Se o usuário navegar entre páginas várias vezes,
  vários intervals ficam rodando em background — memory leak leve.
- **Fix:**
  ```js
  import { onUnmounted } from 'vue'
  // ...
  onUnmounted(() => {
    if (timerAgora) clearInterval(timerAgora)
  })
  ```

### 4. Parsing frágil de URL do Storage

- **Arquivo:** `src/composables/useAnexos.js`
- **Problema:** ao gerar link compartilhável, o código faz
  `urlStorage.split('/storage/v1/object/public/anexos/')[1]` para extrair
  o path do arquivo. Se o Supabase mudar o formato da URL (ou se o bucket
  mudar de nome), quebra silenciosamente.
- **Fix:** guardar o `path` do arquivo (não a URL inteira) na coluna `url_storage`
  do banco. Ao precisar da URL pública, montar sob demanda com
  `supabase.storage.from('anexos').getPublicUrl(path)`. Migration nova para
  transformar dados existentes.

---

## Refatorações maiores (discussão aberta)

Não priorizei porque envolvem decisão de time/produto — ver seção
**"Próximos passos"** no `README.md`:

- Migrar para TypeScript
- Adicionar Vitest + testes de store
- Quebrar `AgendaPage`, `ConfiguracoesPage`, `PacienteDetalhePage` em subcomponentes
- Edge Functions do Supabase para envio de lembretes

---

## Como usar este arquivo

- Item feito → **remover** dele. Não deixar `~~riscado~~`, não deixar "resolvido em Y".
  O git guarda o histórico.
- Item novo → adicionar seguindo o mesmo formato (arquivo, problema, o que fazer).
- Item que virou issue no repositório → linkar aqui e no commit da solução.
