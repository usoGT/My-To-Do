// Rutin onay satırı (Bugün ve Rutinler sayfalarında ortak)
import { html, delegate } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { toggleRoutineDone } from '../store/actions/routines.js';
import { getRoutineStreak } from '../store/selectors.js';
import { formatDuration } from '../lib/dates.js';
import { toast } from './toast.js';

export function routineCheckItem(state, r, dateKey, today) {
  const streak = getRoutineStreak(state, r.id, today);
  const future = dateKey > today;
  return html`
    <li class="routine-check c-${r.color} ${r.done ? 'is-done' : ''}">
      <button type="button" class="check check--lg" role="checkbox" aria-checked="${r.done}" data-action="toggle-routine" data-id="${r.id}" data-date="${dateKey}" ${future ? 'disabled' : ''}
        aria-label="${r.done ? 'Yapılmadı olarak işaretle' : 'Yapıldı'}: ${r.title}">${icon('check')}</button>
      <div class="grow">
        <div class="routine-check-title">${r.title}</div>
        <div class="xsmall muted">${[r.time, formatDuration(r.durationMin)].filter(Boolean).join(' · ')}</div>
      </div>
      ${streak ? html`<span class="streak" title="${streak} gün seri">${icon('flame')}${streak}</span>` : ''}
    </li>`;
}

export function bindRoutineChecks(root, today) {
  return delegate(root, 'click', '[data-action="toggle-routine"]', (e, el) => {
    try {
      toggleRoutineDone(el.dataset.id, el.dataset.date, today());
    } catch (err) {
      toast(err.message, { type: 'error' });
    }
  });
}
