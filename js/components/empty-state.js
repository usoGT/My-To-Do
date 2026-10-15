// Boş durum kutusu
import { html } from '../lib/dom.js';
import { icon } from '../lib/icons.js';

export function emptyState({ icon: iconName = 'inbox', title, text = '', action = null, compact = false }) {
  return html`
    <div class="empty" ${compact ? html`style="padding: var(--space-5) var(--space-4)"` : ''}>
      <div class="empty-icon">${icon(iconName)}</div>
      ${title ? html`<h3>${title}</h3>` : ''}
      ${text ? html`<p>${text}</p>` : ''}
      ${action ? html`<button type="button" class="btn btn--primary btn--sm" data-action="${action.dataAction}" ${action.data ? html`data-id="${action.data}"` : ''}>${icon(action.icon || 'plus')} ${action.label}</button>` : ''}
    </div>`;
}
