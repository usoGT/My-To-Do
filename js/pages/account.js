// Hesabım: giriş / kayıt / şifre sıfırlama; giriş yapılmışsa profil ve senkron durumu.
// Adres: #/hesap  ·  #/hesap?sifre=yeni (şifre sıfırlama bağlantısından dönüş)
import { html, delegate, qs } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import * as api from '../lib/supabase.js';
import { getSyncStatus, onSyncStatus, syncNow, startForUser, signOutAndClear, remoteHasData, localHasData, isSignedIn } from '../lib/sync.js';
import { getState } from '../store/store.js';
import { updateSettings } from '../store/actions/settings.js';
import { bindForm, formError } from '../components/form.js';
import { confirmDialog } from '../components/confirm.js';
import { openModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { navigate } from '../router.js';
import { fail } from '../lib/errors.js';
import { formatTimeAgo } from '../lib/dates.js';

export const SYNC_LABELS = {
  off: 'Eşitleme kapalı',
  idle: 'Eşitlendi',
  pending: 'Bekleyen değişiklikler var',
  syncing: 'Eşitleniyor…',
  offline: 'Çevrimdışı — internet gelince eşitlenecek',
  error: 'Eşitleme hatası',
  'needs-setup': 'Eşitleme başlatılmadı',
};

const validEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

function notConfiguredView() {
  return html`
    <div class="card account-card">
      <div class="account-hero">${icon('user')}</div>
      <h2>Hesap sistemi henüz kurulmadı</h2>
      <p class="muted">Hesap ve cihazlar arası eşitleme için bir Supabase projesi gerekiyor. Projeyi açıp adresini ve anahtarını <code>js/config.js</code> dosyasına yazınca burada giriş ekranı görünür.</p>
      <ol class="account-steps small">
        <li>supabase.com'da ücretsiz bir proje aç.</li>
        <li><code>supabase/schema.sql</code> dosyasını projenin SQL Editor'ünde çalıştır.</li>
        <li>Project Settings → API'deki <b>Project URL</b> ve <b>anon public</b> anahtarını <code>js/config.js</code>'e yapıştır.</li>
      </ol>
      <p class="xsmall muted">Ayrıntılar: <code>docs/HESAP-KURULUM.md</code>. Hesap olmadan da uygulama bu cihazda çalışmaya devam eder.</p>
    </div>`;
}

function authView(ui) {
  if (ui.mode === 'forgot') {
    return html`
      <div class="card account-card">
        <h2>Şifreni mi unuttun?</h2>
        <p class="muted small">E-postanı yaz, şifre sıfırlama bağlantısı gönderelim.</p>
        <form id="forgot-form" class="stack" novalidate>
          <div class="field"><label for="fg-email">E-posta</label><input class="input" id="fg-email" name="email" type="email" autocomplete="email" value="${ui.email}" autofocus><p class="field-error"></p></div>
          ${formError()}
          <button type="submit" class="btn btn--primary btn--block">Bağlantı gönder</button>
        </form>
        <button type="button" class="btn btn--ghost btn--block" data-action="mode" data-mode="login">${icon('arrowLeft')} Girişe dön</button>
      </div>`;
  }
  const login = ui.mode !== 'signup';
  return html`
    <div class="card account-card">
      <div class="account-hero">${icon('user')}</div>
      <h2>${login ? 'Hesabına giriş yap' : 'Hesap oluştur'}</h2>
      <p class="muted small">Hesapla görevlerin, derslerin ve notların telefonunda, bilgisayarında ve tabletinde aynı olur.</p>
      <div class="segmented account-tabs" role="tablist">
        <button type="button" role="tab" aria-selected="${login}" aria-pressed="${login}" data-action="mode" data-mode="login">Giriş yap</button>
        <button type="button" role="tab" aria-selected="${!login}" aria-pressed="${!login}" data-action="mode" data-mode="signup">Kayıt ol</button>
      </div>
      <form id="auth-form" class="stack" novalidate>
        ${login ? '' : html`<div class="field"><label for="au-name">Adın <span class="muted">(isteğe bağlı)</span></label><input class="input" id="au-name" name="name" autocomplete="given-name" maxlength="40" value="${getState().settings.name}" placeholder="Örn. Üsame"></div>`}
        <div class="field"><label for="au-email">E-posta</label><input class="input" id="au-email" name="email" type="email" autocomplete="email" value="${ui.email}" autofocus><p class="field-error"></p></div>
        <div class="field"><label for="au-pass">Şifre</label><input class="input" id="au-pass" name="password" type="password" autocomplete="${login ? 'current-password' : 'new-password'}" minlength="6"><p class="field-error"></p></div>
        ${login ? '' : html`<div class="field"><label for="au-pass2">Şifre (tekrar)</label><input class="input" id="au-pass2" name="password2" type="password" autocomplete="new-password"><p class="field-error"></p></div>`}
        ${formError()}
        <button type="submit" class="btn btn--primary btn--block">${login ? 'Giriş yap' : 'Hesap oluştur'}</button>
      </form>
      ${login ? html`<button type="button" class="btn btn--ghost btn--block" data-action="mode" data-mode="forgot">Şifremi unuttum</button>` : html`<p class="xsmall muted">En az 6 karakterli bir şifre seç.</p>`}
      ${ui.notice ? html`<p class="account-notice small">${icon('info')} ${ui.notice}</p>` : ''}
    </div>`;
}

function newPasswordView() {
  return html`
    <div class="card account-card">
      <h2>Yeni şifre belirle</h2>
      <form id="newpass-form" class="stack" novalidate>
        <div class="field"><label for="np-pass">Yeni şifre</label><input class="input" id="np-pass" name="password" type="password" autocomplete="new-password" autofocus><p class="field-error"></p></div>
        <div class="field"><label for="np-pass2">Yeni şifre (tekrar)</label><input class="input" id="np-pass2" name="password2" type="password" autocomplete="new-password"><p class="field-error"></p></div>
        ${formError()}
        <button type="submit" class="btn btn--primary btn--block">Şifreyi kaydet</button>
      </form>
    </div>`;
}

function profileView() {
  const user = api.getUser();
  const s = getSyncStatus();
  const tone = s.state === 'idle' ? 'success' : s.state === 'error' ? 'danger' : s.state === 'offline' ? 'warning' : 'primary';
  return html`
    <div class="account-grid">
      <section class="card account-card">
        <div class="account-profile">
          <span class="avatar avatar--lg">${(user.name || user.email || '?')[0].toLocaleUpperCase('tr-TR')}</span>
          <div class="grow">
            <h2 class="truncate">${user.name || 'Hesabım'}</h2>
            <p class="muted small truncate">${user.email}</p>
          </div>
        </div>
        <div class="row wrap">
          <button type="button" class="btn btn--sm" data-action="edit-name">${icon('edit')} Adını değiştir</button>
          <button type="button" class="btn btn--sm" data-action="change-pass">${icon('settings')} Şifreyi değiştir</button>
          <button type="button" class="btn btn--sm btn--danger" data-action="signout">Çıkış yap</button>
        </div>
      </section>
      <section class="card account-card">
        <h2 class="row">${icon('repeat')} Eşitleme</h2>
        ${s.state === 'needs-setup' ? html`
          <p class="small">Bu cihazda eşitleme henüz başlamadı.</p>
          <button type="button" class="btn btn--primary" data-action="setup">Eşitlemeyi başlat</button>` : html`
          <p class="sync-line"><span class="sync-dot tone-${tone}"></span><b>${SYNC_LABELS[s.state] || s.state}</b></p>
          ${s.error && s.state === 'error' ? html`<p class="small" style="color:var(--danger)">${s.error}</p>` : ''}
          <dl class="about-list small">
            <dt>Son eşitleme</dt><dd>${s.lastSyncAt ? formatTimeAgo(s.lastSyncAt) : '—'}</dd>
            <dt>Gönderilmeyi bekleyen</dt><dd>${s.pending} değişiklik</dd>
          </dl>
          <button type="button" class="btn" data-action="sync-now" ${s.state === 'syncing' ? 'disabled' : ''}>${icon('repeat')} Şimdi eşitle</button>
          <p class="xsmall muted">Değişikliklerin birkaç saniye içinde, açık olan diğer cihazlarına da en geç 30 saniyede ulaşır. İnternet yokken çalışmaya devam edebilirsin; bağlantı gelince eşitlenir.</p>`}
      </section>
    </div>`;
}

function view(ui) {
  if (!api.isConfigured()) return notConfiguredView();
  if (ui.recovery && api.getUser()) return newPasswordView();
  if (!api.getUser()) return authView(ui);
  return profileView();
}

// Girişten sonra: bu cihazdaki ve hesaptaki veriye göre eşitlemeyi başlatır.
export async function setupAfterSignIn() {
  let remote = false;
  try { remote = await remoteHasData(); } catch (err) { toast(err.message, { type: 'error' }); return; }
  const local = localHasData();
  let mode = 'replace';
  if (local && !remote) mode = 'merge';
  if (local && remote) mode = await chooseMergeMode();
  if (!mode) return;
  try {
    await startForUser(mode);
    toast(mode === 'merge' ? 'Bu cihazdaki veriler hesabına eklendi.' : 'Hesabındaki veriler yüklendi.', { type: 'success' });
  } catch (err) {
    toast(`Eşitleme başlatıldı ama tamamlanamadı: ${err.message}`, { type: 'error', duration: 6000 });
  }
}

function chooseMergeMode() {
  return new Promise((resolve) => {
    let result = null;
    openModal({
      title: 'Verileri birleştirelim mi?',
      size: 'sm',
      content: html`
        <p>Hem bu cihazda hem de hesabında veri var.</p>
        <div class="stack-sm">
          <button type="button" class="btn btn--primary btn--block" data-choice="merge">Bu cihazdakileri hesabıma ekle</button>
          <button type="button" class="btn btn--block" data-choice="replace">Hesaptakileri kullan, bu cihazdakileri sil</button>
        </div>
        <p class="xsmall muted">Emin değilsen ilkini seç: hiçbir şey silinmez, iki taraftaki veriler birleşir.</p>`,
      onMount(el, close) {
        el.querySelectorAll('[data-choice]').forEach((b) => b.addEventListener('click', () => { result = b.dataset.choice; close(); }));
      },
      onClose: () => resolve(result),
    });
  });
}

export default {
  title: 'Hesabım',
  render(root, { query }) {
    const ui = { mode: 'login', email: '', notice: '', recovery: query.sifre === 'yeni' };
    const draw = () => {
      root.innerHTML = String(html`
        <div class="page-header"><div><h1>Hesabım</h1><p>${api.getUser() ? 'Hesabın ve eşitleme durumu.' : 'Giriş yap, verilerin tüm cihazlarında eşitlensin.'}</p></div></div>
        <div class="account-wrap">${view(ui)}</div>`);
      bindForms();
    };

    const bindForms = () => {
      const auth = qs('#auth-form', root);
      if (auth) {
        bindForm(auth, async (fd) => {
          const email = String(fd.get('email') || '').trim();
          const password = String(fd.get('password') || '');
          ui.email = email;
          if (!validEmail(email)) fail('Geçerli bir e-posta yaz.', 'email');
          if (password.length < 6) fail('Şifre en az 6 karakter olmalı.', 'password');
          const btn = auth.querySelector('[type=submit]');
          btn.disabled = true;
          try {
            if (ui.mode === 'signup') {
              if (password !== fd.get('password2')) fail('Şifreler aynı değil.', 'password2');
              const name = String(fd.get('name') || '').trim();
              const r = await api.signUp(email, password, name);
              if (name && !getState().settings.name) updateSettings({ name });
              if (!r.signedIn) {
                ui.mode = 'login';
                ui.notice = `${email} adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsin.`;
                draw();
                return false;
              }
              toast('Hesabın oluşturuldu.', { type: 'success' });
            } else {
              await api.signIn(email, password);
              toast('Giriş yapıldı.', { type: 'success' });
            }
            await setupAfterSignIn();
            draw();
          } catch (err) {
            if (err.name === 'ApiError') {
              const e = new Error(err.message);
              e.name = 'ValidationError';
              throw e;
            }
            throw err;
          } finally {
            btn.disabled = false;
          }
          return false;
        });
      }
      const forgot = qs('#forgot-form', root);
      if (forgot) {
        bindForm(forgot, async (fd) => {
          const email = String(fd.get('email') || '').trim();
          if (!validEmail(email)) fail('Geçerli bir e-posta yaz.', 'email');
          try {
            await api.resetPassword(email, `${location.origin}${location.pathname}`);
          } catch (err) {
            const e = new Error(err.message); e.name = 'ValidationError'; throw e;
          }
          ui.mode = 'login';
          ui.email = email;
          ui.notice = 'Şifre sıfırlama bağlantısı gönderildi. E-postanı kontrol et.';
          draw();
          return false;
        });
      }
      const np = qs('#newpass-form', root);
      if (np) {
        bindForm(np, async (fd) => {
          const p = String(fd.get('password') || '');
          if (p.length < 6) fail('Şifre en az 6 karakter olmalı.', 'password');
          if (p !== fd.get('password2')) fail('Şifreler aynı değil.', 'password2');
          try { await api.updatePassword(p); } catch (err) { const e = new Error(err.message); e.name = 'ValidationError'; throw e; }
          toast('Şifren güncellendi.', { type: 'success' });
          ui.recovery = false;
          navigate('/hesap', {}, { replace: true });
          return false;
        });
      }
    };

    draw();
    const offStatus = onSyncStatus(() => { if (api.getUser() && !qs('form', root)) draw(); });
    const offAuth = api.onAuthChange(() => { if (!qs('form', root) || !api.getUser()) draw(); });

    const offClick = delegate(root, 'click', '[data-action]', async (e, el) => {
      const a = el.dataset.action;
      if (a === 'mode') { ui.mode = el.dataset.mode; ui.notice = ''; draw(); }
      else if (a === 'sync-now') {
        try { await syncNow(); toast('Eşitlendi.', { type: 'success', duration: 1500 }); } catch (err) { toast(err.message, { type: 'error' }); }
      } else if (a === 'setup') setupAfterSignIn().then(draw);
      else if (a === 'signout') {
        if (isSignedIn()) { try { await syncNow(); } catch { /* aşağıda uyarılır */ } }
        const pending = getSyncStatus().pending;
        const ok = await confirmDialog({
          title: 'Çıkış yapılsın mı?',
          message: pending
            ? `${pending} değişiklik henüz hesabına gönderilemedi (internet yok olabilir). Çıkış yaparsan bu değişiklikler kaybolur.`
            : 'Çıkış yapınca bu cihazdaki veriler silinir; hepsi hesabında güvende kalır. Yeniden giriş yapınca geri gelir.',
          confirmText: 'Çıkış yap',
          danger: Boolean(pending),
        });
        if (!ok) return;
        await signOutAndClear();
        toast('Çıkış yapıldı.', { type: 'success' });
        draw();
      } else if (a === 'edit-name') {
        openModal({
          title: 'Adını değiştir',
          size: 'sm',
          content: html`<form id="name-form" class="stack" novalidate>
            <div class="field"><label for="nm-name">Adın</label><input class="input" id="nm-name" name="name" maxlength="40" value="${api.getUser().name || getState().settings.name}" placeholder="Örn. Üsame" autofocus><p class="field-error"></p></div>
            ${formError()}</form>`,
          footer: html`<button type="button" class="btn" data-modal-close>Vazgeç</button><button type="submit" form="name-form" class="btn btn--primary">Kaydet</button>`,
          onMount(m, close) {
            bindForm(m.querySelector('form'), async (fd) => {
              const name = String(fd.get('name') || '').trim().slice(0, 40);
              try { await api.updateProfile(name); } catch (err) { const x = new Error(err.message); x.name = 'ValidationError'; throw x; }
              updateSettings({ name });
              draw();
            }, close);
          },
        });
      } else if (a === 'change-pass') {
        ui.recovery = true;
        draw();
      }
    });
    return () => { offStatus(); offAuth(); offClick(); };
  },
};
