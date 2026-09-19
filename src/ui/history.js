// History screen: saved swings, filter by club, trend sparklines per metric.
import { el, svg, chips, select, listRow, clubLabel, viewLabel, fmtDate, fmt } from './dom.js';
import { CLUB_LIST } from '../clubs.js';
import { listSwings } from '../store.js';
import { NORMS, METRIC_IDS } from '../norms.js';

const state = { club: 'all', view: 'all' };

export async function renderHistory(root, ctx) {
  const { onOpen } = ctx;
  root.replaceChildren(el('p', { class: 'muted' }, 'Loading saved swings'));
  let all = [];
  try { all = await listSwings(); } catch (err) { root.replaceChildren(el('p', { class: 'muted' }, `Could not read saved swings: ${err.message}`)); return; }

  const rows = all.filter((r) => (state.club === 'all' || r.club === state.club) && (state.view === 'all' || r.view === state.view));
  const rerender = () => renderHistory(root, ctx);

  const list = rows.length
    ? rows.map((r) => listRow(
      r.coaching && r.coaching.headline ? r.coaching.headline.title : 'Swing',
      `${fmtDate(r.date)}. ${clubLabel(r.club)}, ${viewLabel(r.view)}${r.note ? `. ${r.note}` : ''}`,
      null, () => onOpen(r.id)))
    : [el('div', { class: 'card muted' }, all.length ? 'No saved swings match this filter.' : 'No saved swings yet. Analyse a clip and save it to start a history.')];

  root.replaceChildren(
    el('div', { class: 'stack' },
      el('div', { class: 'card stack' },
        el('div', { class: 'field' }, el('span', { class: 'field-label' }, 'Club'),
          select([['all', 'All clubs'], ...CLUB_LIST.filter((c) => all.some((r) => r.club === c.id)).map((c) => [c.id, c.label])], state.club, (v) => { state.club = v; rerender(); })),
        el('div', { class: 'field' }, el('span', { class: 'field-label' }, 'Angle'),
          chips([['all', 'All'], ['fo', 'Face-on'], ['dtl', 'Down-the-line']], state.view, (v) => { state.view = v; rerender(); }))),
      ...list,
      renderTrends(rows)));
}

function renderTrends(rows) {
  const ordered = rows.slice().reverse(); // oldest first
  if (ordered.length < 2) return el('div', { class: 'card muted' }, 'Trends appear once two or more swings of the same club and angle are saved.');
  const views = new Set(ordered.map((r) => r.view));
  const ids = [...(views.has('fo') ? METRIC_IDS.fo : []), ...(views.has('dtl') ? METRIC_IDS.dtl : []), ...METRIC_IDS.both];
  const lines = [];
  for (const id of ids) {
    const points = ordered.map((r) => {
      const m = (r.analysis && r.analysis.metrics || []).find((x) => x.id === id);
      return m && m.value !== null ? m : null;
    }).filter(Boolean);
    if (points.length < 2) continue;
    const last = points[points.length - 1];
    lines.push(el('div', { class: 'spark' },
      sparkline(points.map((p) => p.value)),
      el('div', { class: 'name' }, NORMS[id] ? NORMS[id].label : id),
      el('div', { class: 'last' }, el('span', {}, fmt(last.value, last.unit)), el('span', { class: `pill ${last.band}` }, last.band))));
  }
  return el('div', { class: 'card' },
    el('h2', {}, `Trend over ${ordered.length} swings`),
    el('p', { class: 'muted small' }, 'Oldest on the left, newest on the right. The filter above picks which swings count.'),
    lines.length ? lines : el('p', { class: 'muted' }, 'No shared metrics between these swings yet.'));
}

export function sparkline(values, w = 84, h = 30) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = values.length === 1 ? w / 2 : (i / (values.length - 1)) * (w - 4) + 2;
    const y = h - 2 - ((v - min) / span) * (h - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const lastPt = pts[pts.length - 1].split(',');
  return svg('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, 'aria-hidden': 'true' },
    svg('polyline', { points: pts.join(' '), fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }),
    svg('circle', { cx: lastPt[0], cy: lastPt[1], r: 3, fill: 'currentColor' }));
}
