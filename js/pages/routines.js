// Rutinler: bugünün rutinleri, rutin kartları (seri, oran, 4 haftalık mini takvim), arşiv.
import { html, delegate } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { getState, subscribe } from '../store/store.js';
import { getRoutinesForDate, getRoutineStreak, getRoutineBestStreak, getRoutineCompletionRate, isRoutineDone, isRoutineScheduled } from '../store/selectors.js';
import { toggleRoutineDone } from '../store/actions/routines.js';
import { openRoutineForm } from '../components/routine-form.js';
import { routineCheckItem, bindRoutineChecks } from '../components/routine-check.js';
import { emptyState } from '../components/empty-state.js';
import { toast } from '../components/toast.js';
import { todayKey, startOfWeek, addDays, WEEKDAYS_SHORT_TR, formatDuration, formatDayMonth, parseDate } from '../lib/dates.js';

function miniCalendar(state, r, today) {
  const start = addDays(startOfWeek(today), -21);
  const days = Array.from({ length: 28 }, (_, i) => addDays(start, i));
  return html`
    <div class="mini-cal" role="grid" aria-label="Son 4 hafta">
      ${WEEKDAYS_SHORT_TR.map((d) => html`<span class="mini-cal-head" aria-hidden="true">${d[0]}</span>`)}
      ${days.map((d) => {
        const planned = r.weekdays.includes((parseDate(d).getDay() + 6) % 7);
        const done = isRoutineDone(state, r.id, d);
        const future = d > today;
        const cls = done ? 'done' : planned && isRoutineScheduled(r, d) && d < today ? 'missed' : planned ? 'planned' : 'off';
        return html`<button type="button" class="mini-cal-cell ${cls} ${d === today ? 'is-today' : ''}" data-action="toggle-day" data-id="${r.id}" data-date="${d}"
          ${future ? 'disabled' : ''} aria-pressed="${done}" title="${formatDayMonth(d)}${done ? ' · yapıldı' : ''}" aria-label="${formatDayMonth(d)}${done ? ', yapıldı' : ''}"></button>`;
      })}
    </div>`;
}

function routineCard(state, r, today) {
  const streak = getRoutineStreak(state, r.id, today);
  const best = getRoutineBestStreak(state, r.id, today);
  const rate = getRoutineCompletionRate(state, r.id, today);
  return html`
    <article class="card card--tight routine-card c-${r.color} ${r.archived ? 'is-archived' : ''}">
      <div class="routine-card-top">
        <div class="grow">
          <h3 class="truncate">${r.title}</h3>
          <div class="routine-days" aria-label="Günler">
            ${WEEKDAYS_SHORT_TR.map((d, i) => html`<span class="${r.weekdays.includes(i) ? 'on' : ''}">${d}</span>`)}
          </div>
          <div class="xsmall muted">${[r.time, formatDuration(r.durationMin)].filter(Boolean).join(' · ')}</div>
        </div>
        <button type="button" class="btn btn--ghost btn--icon btn--sm" data-action="edit-routine" data-id="${r.id}" aria-label="${r.title} rutinini düzenle">${icon('edit')}</button>
      </div>
      <div class="routine-stats">
        <div><span class="streak streak--big">${icon('flame')}${streak}</span><span class="xsmall muted">gün seri</span></div>
        <div><strong>${best}</strong><span class="xsmall muted">en iyi seri</span></div>
        <div><strong>${rate === null ? '—' : `%${rate}`}</strong><span class="xsmall muted">son 30 gün</span></div>
      </div>
      ${miniCalendar(state, r, today)}
    </article>`;
}

function view(state) {
  const today = todayKey();
  const todays = getRoutinesForDate(state, today);
  const active = state.routines.filter((r) => !r.archived);
  const archived = state.routines.filter((r) => r.archived);
  const doneCount = todays.filter((r) => r.done).length;
  return html`
    <div class="page-header">
      <div>
        <h1>Rutinler</h1>
        <p>Tekrar eden alışkanlıkların ve serilerin.</p>
      </div>
      <button type="button" class="btn btn--primary" data-action="add-routine">${icon('plus')} Rutin ekle</button>
    </div>

    ${state.routines.length === 0
      ? emptyState({ icon: 'repeat', title: 'Henüz rutin yok', text: 'Her gün ya da haftanın belirli günlerinde yapmak istediğin alışkanlıkları ekle, serini takip et.', action: { label: 'Rutin ekle', dataAction: 'add-routine' } })
      : html`
        <section class="section">
          <h2 class="section-title">Bugünün rutinleri <span class="count">${todays.length ? `${doneCount}/${todays.length}` : ''}</span></h2>
          ${todays.length
            ? html`<ul class="card card--tight routine-check-list">${todays.map((r) => routineCheckItem(state, r, today, today))}</ul>`
            : html`<p class="small muted">Bugün planlı rutin yok.</p>`}
        </section>

        <section class="section">
          <h2 class="section-title">Tüm rutinler</h2>
          <div class="routine-grid">${active.map((r) => routineCard(state, r, today))}</div>
          <p class="xsmall muted">Mini takvimde geçmiş bir güne tıklayarak o günü işaretleyebilir ya da işareti kaldırabilirsin.</p>
        </section>

        ${archived.length ? html`
          <section class="section">
            <details class="fold">
              <summary>${icon('chevronRight')} Arşiv <span class="count">${archived.length}</span></summary>
              <div class="fold-body routine-grid">${archived.map((r) => routineCard(state, r, today))}</div>
            </details>
          </section>` : ''}`}`;
}

export default {
  title: 'Rutinler',
  render(root) {
    const draw = () => {
      const openFold = root.querySelector('details.fold')?.open;
      root.innerHTML = String(view(getState()));
      if (openFold) root.querySelector('details.fold')?.setAttribute('open', '');
    };
    draw();
    const unsub = subscribe(draw);
    const offChecks = bindRoutineChecks(root, todayKey);
    const offClick = delegate(root, 'click', '[data-action]', (e, el) => {
      const a = el.dataset.action;
      if (a === 'add-routine') openRoutineForm();
      else if (a === 'edit-routine') openRoutineForm({ routine: getState().routines.find((r) => r.id === el.dataset.id) });
      else if (a === 'toggle-day') {
        try { toggleRoutineDone(el.dataset.id, el.dataset.date, todayKey()); } catch (err) { toast(err.message, { type: 'error' }); }
      }
    });
    return () => { unsub(); offChecks(); offClick(); };
  },
};
