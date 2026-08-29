-- Migration 009: Campos extras — cor nos tipos e slot nas disponibilidades

-- Cor para diferenciar tipos de atendimento no calendário
alter table public.tipos_atendimento
  add column if not exists cor text;

-- Duração do slot (intervalo entre agendamentos) por dia da semana
alter table public.disponibilidades
  add column if not exists duracao_slot integer not null default 60;
