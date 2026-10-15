// Sunucu ayarları: Supabase proje adresi ve "Publishable key" (sb_publishable_…). Secret key ASLA buraya yazılmaz.
// Ayrıntılı kurulum: docs/HESAP-KURULUM.md
// Not: publishable anahtar herkese açık olabilir; verileri koruyan şey veritabanındaki satır güvenliği (RLS) kurallarıdır.
export const SUPABASE_URL = 'https://wejmqirmpkkrfccyipcm.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_iiOqO0aGGST9EEHSQx2HOw_Zzjs5YkF';

// Geliştirme kolaylığı: localStorage['planlayici-supabase'] = '{"url":"…","key":"…"}' yazılırsa o kullanılır
// (ör. tools/mock-supabase.mjs ile yerel deneme). Normal kullanımda gerekmez.
export function getServerConfig() {
  try {
    const o = JSON.parse(localStorage.getItem('planlayici-supabase') || 'null');
    if (o && o.url && o.key) return { url: o.url.replace(/\/+$/, ''), key: o.key };
  } catch { /* yok say */ }
  return { url: SUPABASE_URL.replace(/\/+$/, ''), key: SUPABASE_ANON_KEY };
}
