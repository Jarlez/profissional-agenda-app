<template>
  <q-page class="flex flex-center bg-grey-2" style="min-height: 100vh">
    <div class="text-grey-6">Agendamento público — em construção.</div>
  </q-page>
</template>

<!--
  TODO(agendamento-publico): implementar página pública de agendamento.

  Fluxo esperado (rota: /agendar/:slug):
    1. Ler `slug` da rota (useRoute().params.slug).
    2. Buscar profissional em `profissionais` where slug = :slug (RLS já libera SELECT público — ver 001_profissionais.sql).
       Se não encontrar → mostrar 404 amigável.
    3. Carregar `tipos_atendimento` ativos + `disponibilidades` ativas do profissional.
       RLS já libera SELECT público — ver 003_tipos_atendimento.sql e 004_disponibilidades.sql.
    4. Reutilizar useDisponibilidade.gerarSlotsDisponiveis(data) para montar a grade.
       Filtrar slots ocupados (agendamentos existentes) — o composable já faz isso.
    5. Filtrar slots dentro de bloqueios ativos (005_bloqueios.sql).
    6. Formulário do paciente: nome, telefone, email (sem cadastro/senha).
       Ao confirmar: insert em `contatos` (RLS bloqueia insert direto — precisa criar policy
       de INSERT público OU usar uma Edge Function com service_role) e depois insert em
       `agendamentos` (RLS já libera INSERT público — ver 006_agendamentos.sql linha 47-49).
       ATENÇÃO: hoje a policy pública de agendamentos existe mas contatos não têm — resolver.
    7. Após sucesso: tela de confirmação com resumo + botão "Adicionar ao Google Agenda".

  Considerações:
    - Sem autenticação. Toda operação passa por RLS público.
    - Enviar notificação (WhatsApp/email) ao profissional — depende de Edge Function.
    - Rate-limiting no formulário para evitar spam de agendamentos falsos.
-->
