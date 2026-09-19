// Tiny DOM helpers shared by the screens. Browser only.
import { CLUB_LIST, clubLabel as clubLabelOf, clubShort } from '../clubs.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function applyAttrs(node, attrs) {
  for (const [key, val] of Object.entries(attrs || {})) {
    if (val === null || val === undefined) continue;
    if (key === 'class') node.className = val;
    else if (key === 'text') node.textContent = val;
    else if (key === 'style' && typeof val === 'object') Object.assign(node.style, val);
    else if (key === 'dataset') Object.assign(node.dataset, val);
    else if (key.startsWith('on') && typeof val === 'function') node.addEventListener(key.slice(2).toLowerCase(), val);
    else if (typeof val === 'boolean') {
      if (key in node) node[key] = val;
      else if (val) node.setAttribute(key, '');
    } else if (key === 'value') node.value = val;
    else node.setAttribute(key, String(val));
  }
}

/** Append children: strings become text nodes, arrays flatten, null/false skip. */
export function append(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** el('div', { class: 'x', onClick }, 'text', childNode, [more]) */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  applyAttrs(node, attrs);
  append(node, children);
  return node;
}

export function svg(tag, attrs = {}, ...children) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  }
  append(node, children);
  return node;
}

export function button(label, onClick, cls = 'btn') {
  return el('button', { type: 'button', class: cls, onClick }, label);
}

/** Row of toggle chips. options = [[value, label], ...]. */
export function chips(options, value, onPick) {
  return el('div', { class: 'chips', role: 'group' }, options.map(([v, label]) => el('button', {
    type: 'button',
    class: 'chip',
    'aria-pressed': String(String(v) === String(value)),
    onClick: () => onPick(v),
  }, label)));
}

/** Segmented control: one row, every option the same width. options = [[value, label], ...]. */
export function segmented(options, value, onPick, label) {
  return el('div', { class: 'seg', role: 'group', 'aria-label': label || null }, options.map(([v, text]) => el('button', {
    type: 'button',
    'aria-pressed': String(String(v) === String(value)),
    onClick: () => onPick(v),
  }, text)));
}

const CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

/** Settings-style row: label and detail on the left, a control or a chevron on the right. */
export function listRow(label, detail, control, onClick) {
  const chev = el('span', { class: 'chev' });
  chev.innerHTML = CHEVRON;
  const row = el(onClick ? 'button' : 'div', {
    type: onClick ? 'button' : null,
    class: `list-row${onClick ? ' card tap flat' : ''}`,
    onClick: onClick || null,
  },
  el('div', { class: 'text' }, el('div', { class: 'label' }, label), detail ? el('div', { class: 'detail' }, detail) : null),
  control || (onClick ? chev : null));
  if (onClick) { row.style.padding = '12px 14px'; row.style.borderRadius = 'var(--radius-sm)'; }
  return row;
}

export function select(options, value, onChange, cls = '') {
  const node = el('select', { class: cls, onChange: (e) => onChange(e.target.value) },
    options.map(([v, label]) => el('option', { value: String(v) }, label)));
  node.value = String(value);
  return node;
}

export function field(label, control, hint) {
  return el('div', { class: 'field' },
    el('span', { class: 'field-label', text: label }),
    control,
    hint ? el('p', { class: 'muted hint', text: hint }) : null);
}

/** Labelled on/off switch row. */
export function switchRow(label, on, onToggle, detail) {
  const sw = el('button', {
    type: 'button',
    class: 'switch',
    role: 'switch',
    'aria-checked': String(!!on),
    'aria-label': label,
    onClick: () => onToggle(!on),
  });
  return el('div', { class: 'switch-row' },
    el('div', { class: 'switch-text' },
      el('div', { class: 'switch-label', text: label }),
      detail ? el('div', { class: 'muted', text: detail }) : null),
    sw);
}

export function round(v, digits) {
  const m = 10 ** digits;
  return Math.round(v * m) / m;
}

/** Value plus unit for the report card. Null means not measured. */
export function fmt(value, unit) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a';
  switch (unit) {
    case 'cm': return `${round(value, 1)} cm`;
    case 'deg': return `${round(value, 0)} deg`;
    case 'pct': return `${round(value, 0)}%`;
    case 'ratio': return `${round(value, 1)}:1`;
    case 's': return `${round(value, 2)} s`;
    case 'frames': return `${round(value, 0)} frames`;
    case 'bool': return value ? 'Yes' : 'No';
    default: return String(round(value, 2));
  }
}

export function confidenceWord(c) {
  if (typeof c !== 'number' || Number.isNaN(c)) return 'low';
  if (c >= 0.75) return 'high';
  if (c >= 0.5) return 'medium';
  return 'low';
}

export function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso || '');
  return d.toLocaleString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

/** Every club as [id, label] pairs, bag order. */
export const CLUBS = CLUB_LIST.map((c) => [c.id, c.label]);
export const VIEW_LABEL = { fo: 'Face-on', dtl: 'Down-the-line', unknown: 'Angle unknown', both: 'Either angle' };
export const ANGLE_OPTIONS = [['auto', 'Auto'], ['fo', 'Face-on'], ['dtl', 'Down-the-line']];
export const PHASES = [['p1', 'Address'], ['p4', 'Top'], ['p7', 'Impact'], ['p10', 'Finish']];

export function clubLabel(club) {
  return clubLabelOf(club);
}

/**
 * One-row scrolling strip of club chips (short labels). ids = club ids to offer.
 * The chosen chip is scrolled into the middle once the strip is on screen.
 */
export function clubStrip(ids, value, onPick) {
  const strip = el('div', { class: 'strip', role: 'group', 'aria-label': 'Club' });
  let chosen = null;
  for (const id of ids) {
    const on = id === value;
    const chip = el('button', { type: 'button', class: 'chip compact', 'aria-pressed': String(on), title: clubLabelOf(id), onClick: () => onPick(id) }, clubShort(id));
    if (on) chosen = chip;
    strip.append(chip);
  }
  if (chosen) {
    requestAnimationFrame(() => {
      if (!strip.isConnected) return;
      strip.scrollLeft = Math.max(0, chosen.offsetLeft - strip.clientWidth / 2 + chosen.offsetWidth / 2);
    });
  }
  return strip;
}

export function viewLabel(view) {
  return VIEW_LABEL[view] || String(view || 'Angle unknown');
}

export function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = el('div', { id: 'toast', role: 'status' });
    document.body.append(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2400);
}
