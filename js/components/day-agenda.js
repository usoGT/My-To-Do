// Bir günün rutinleri ve "Günün akışı" zaman çizelgesi (Bugün ve Planlayıcı gün görünümü).
import { html } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { routineCheckItem } from './routine-check.js';
import { formatDuration, nowMinutes, timeToMinutes } from '../lib/dates.js';

function timelineItem(entry, { past, dateKey }) {
  if (entry.kind === 'free') {
    return html`
      <li class="tl-item tl-free ${past ? 'is-past' : ''}">
        <span class="tl-time">${entry.start}</span>
        <button type="button" class="tl-card" data-action="add-task" data-date="${dateKey}" data-time="${entry.start}" ${past ? 'disabled' : ''}>
          <span>${formatDuration(entry.item.minutes)} boş</span>
          ${past ? '' : html`<span class="tl-add">${icon('plus')} görev ekle</span>`}
        </button>
      </li>`;
  }
  if (entry.kind === 'class') {
    const c = entry.item;
    return html`
      <li class="tl-item tl-class c-${c.course.color} ${past ? 'is-past' : ''}">
        <span class="tl-time">${entry.start}</span>
        <a class="tl-card" href="#/ders/${c.course.id}">
          <strong class="truncate">${c.course.name}</strong>
          <span class="xsmall muted">${entry.start}–${entry.end}${c.room || c.course.room ? ` · ${c.room || c.course.room}` : ''}</span>
        </a>
      </li>`;
  }
  if (entry.kind === 'task') {
    const t = entry.item;
    return html`
      <li class="tl-item tl-task ${t.done ? 'is-done' : ''} ${past ? 'is-past' : ''}">
        <span class="tl-time">${entry.start}</span>
        <button type="button" class="tl-card" data-action="edit-task" data-id="${t.id}">
          <span class="row" style="gap:6px">${icon('check')}<span class="truncate">${t.title}</span></span>
          <span class="xsmall muted">${entry.start}–${entry.end}</span>
        </button>
      </li>`;
  }
  const r = entry.item;
  return html`
    <li class="tl-item tl-routine c-${r.color} ${r.done ? 'is-done' : ''} ${past ? 'is-past' : ''}">
      <span class="tl-time">${entry.start}</span>
      <div class="tl-card">
        <span class="row" style="gap:6px">${icon('repeat')}<span class="truncate">${r.title}</span></span>
        <span class="xsmall muted">${entry.start}–${entry.end}</span>
      </div>
    </li>`;
}

// a: getDayAgenda sonucu
export function dayTimelineView(a, { dateKey, isToday = false, isPast = false }) {
  const nowMin = nowMinutes();
  const idx = isToday ? a.timeline.findIndex((e) => timeToMinutes(e.end) > nowMin) : -2;
  return html`
    <section class="section">
      <h2 class="section-title">Günün akışı</h2>
      <div class="card card--tight">
        ${a.classes.length ? '' : html`<p class="small muted tl-note">Bu gün ders yok.</p>`}
        <ol class="timeline">
          ${a.timeline.map((e, i) => html`
            ${i === idx ? html`<li class="tl-now" aria-label="Şu an"><span>Şimdi</span></li>` : ''}
            ${timelineItem(e, { dateKey, past: isPast || (isToday && timeToMinutes(e.end) <= nowMin) })}`)}
          ${isToday && idx === -1 && a.timeline.length ? html`<li class="tl-now"><span>Gün bitti</span></li>` : ''}
        </ol>
      </div>
    </section>`;
}

export function dayRoutinesView(state, a, dateKey, today) {
  return html`
    <section class="section">
      <h2 class="section-title">${dateKey === today ? 'Bugünün rutinleri' : 'Rutinler'} <span class="count">${a.routines.length ? `${a.stats.routinesDone}/${a.stats.routinesTotal}` : ''}</span></h2>
      ${a.routines.length
        ? html`<ul class="card card--tight routine-check-list">${a.routines.map((r) => routineCheckItem(state, r, dateKey, today))}</ul>`
        : html`<p class="small muted">Bu gün planlı rutin yok. <a href="#/rutinler">Rutin ekle</a></p>`}
    </section>`;
}
