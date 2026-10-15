-- Planlayıcı — Supabase veritabanı kurulumu
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.
-- Bir kez çalıştırmak yeterli; tekrar çalıştırmak zarar vermez.

-- 1) Tüm kullanıcı verisi tek tabloda: her satır bir kayıt (görev, ders, not, rutin günlüğü, ayarlar …)
create table if not exists public.items (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  collection text        not null,
  id         text        not null,
  data       jsonb,
  deleted    boolean     not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, id)
);

create index if not exists items_user_updated_idx on public.items (user_id, updated_at);

-- 2) Satır güvenliği (RLS): herkes SADECE kendi satırlarını görür ve değiştirir
alter table public.items enable row level security;

drop policy if exists "items: kendi satırlarını oku" on public.items;
drop policy if exists "items: kendi satırlarını ekle" on public.items;
drop policy if exists "items: kendi satırlarını güncelle" on public.items;
drop policy if exists "items: kendi satırlarını sil" on public.items;

create policy "items: kendi satırlarını oku"     on public.items for select using (auth.uid() = user_id);
create policy "items: kendi satırlarını ekle"    on public.items for insert with check (auth.uid() = user_id);
create policy "items: kendi satırlarını güncelle" on public.items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "items: kendi satırlarını sil"     on public.items for delete using (auth.uid() = user_id);

-- 3) updated_at her yazmada sunucu saatiyle güncellenir (cihaz saatleri farklı olsa da sıra doğru kalır)
create or replace function public.items_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists items_touch on public.items;
create trigger items_touch
  before insert or update on public.items
  for each row execute function public.items_touch_updated_at();

-- 4) Ders notu ekleri için özel (herkese kapalı) dosya deposu: attachments/<kullanıcı id>/<dosya id>
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;

drop policy if exists "attachments: kendi dosyalarını oku" on storage.objects;
drop policy if exists "attachments: kendi dosyalarını yükle" on storage.objects;
drop policy if exists "attachments: kendi dosyalarını güncelle" on storage.objects;
drop policy if exists "attachments: kendi dosyalarını sil" on storage.objects;

create policy "attachments: kendi dosyalarını oku" on storage.objects for select
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "attachments: kendi dosyalarını yükle" on storage.objects for insert
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "attachments: kendi dosyalarını güncelle" on storage.objects for update
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "attachments: kendi dosyalarını sil" on storage.objects for delete
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
