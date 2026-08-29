-- Migration 002: Tabela de contatos (CORE genérico)
-- NÃO referenciar conceitos de saúde aqui

create table public.contatos (
  id               uuid primary key default gen_random_uuid(),
  profissional_id  uuid not null references public.profissionais(id) on delete cascade,
  nome             text not null,
  telefone         text,
  email            text,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);

create index idx_contatos_profissional_id on public.contatos (profissional_id);
create index idx_contatos_nome on public.contatos (profissional_id, nome);

create trigger trg_contatos_atualizado_em
  before update on public.contatos
  for each row execute function public.atualizar_timestamp();

-- RLS: profissional só vê seus próprios contatos
alter table public.contatos enable row level security;

create policy "Profissional gerencia seus contatos"
  on public.contatos for all
  using (
    profissional_id in (
      select id from public.profissionais where user_id = auth.uid()
    )
  );
