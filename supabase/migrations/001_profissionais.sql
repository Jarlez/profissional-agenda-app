-- Migration 001: Tabela de profissionais
-- Estende auth.users do Supabase com dados do profissional

create table public.profissionais (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users(id) on delete cascade,
  nome_completo     text not null,
  especialidade     text,
  slug              text unique not null,
  bio               text,
  foto_url          text,
  telefone          text,
  cidade            text,
  registro_profissional text,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);

-- Índice para busca por slug (rota pública /agendar/:slug)
create index idx_profissionais_slug on public.profissionais (slug);
create index idx_profissionais_user_id on public.profissionais (user_id);

-- Atualiza atualizado_em automaticamente
create or replace function public.atualizar_timestamp()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger trg_profissionais_atualizado_em
  before update on public.profissionais
  for each row execute function public.atualizar_timestamp();

-- RLS: profissional só vê/edita seus próprios dados
alter table public.profissionais enable row level security;

create policy "Profissional lê seu próprio perfil"
  on public.profissionais for select
  using (auth.uid() = user_id);

create policy "Profissional atualiza seu próprio perfil"
  on public.profissionais for update
  using (auth.uid() = user_id);

create policy "Profissional insere seu próprio perfil"
  on public.profissionais for insert
  with check (auth.uid() = user_id);

-- Leitura pública do perfil via slug (para a página de agendamento)
create policy "Leitura pública do perfil por slug"
  on public.profissionais for select
  using (true);
