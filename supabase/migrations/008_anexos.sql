-- Migration 008: Anexos (VERTICAL de saúde)

create table public.anexos (
  id               uuid primary key default gen_random_uuid(),
  paciente_id      uuid not null references public.pacientes(id) on delete cascade,
  profissional_id  uuid not null references public.profissionais(id) on delete cascade,
  nome_arquivo     text not null,
  url_storage      text not null,
  tipo_mime        text,
  tamanho_bytes    bigint,
  criado_em        timestamptz not null default now()
);

create index idx_anexos_paciente on public.anexos (paciente_id);
create index idx_anexos_profissional on public.anexos (profissional_id);

-- RLS
alter table public.anexos enable row level security;

create policy "Profissional gerencia seus anexos"
  on public.anexos for all
  using (
    profissional_id in (
      select id from public.profissionais where user_id = auth.uid()
    )
  );
