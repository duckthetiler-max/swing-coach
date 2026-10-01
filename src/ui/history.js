// History screen: saved swings, filter by club, trend sparklines per metric.
import { el, svg, chips, select, section, hero, clubLabel, viewLabel, fmtDate, fmt } from './dom.js';
import { CLUB_LIST } from '../clubs.js';
import { listSwings } from '../store.js';
import { NORMS, METRIC_IDS } from '../norms.js';
import { simpleViewLabel } from '../simple.js';

const state = { club: 'all', view: 'all' };

export async function renderHistory(root, ctx) {
  const { onOpen, simple } = ctx;
  root.replaceChildren(el('p', { class: 'muted' }, 'Loading saved swings'));
  let all = [];
  try { all = await listSwings(); } catch (err) { root.replaceChildren(el('p', { class: 'muted' }, `Could not read saved swings: ${err.message}`)); return; }

  const rows = all.filter((r) => (state.club === 'all' || r.club === state.club) && (state.view === 'all' || r.view === state.view));
  const rerender = () => renderHistory(root, ctx);

  // Simple mode names each swing by its cue, the thing to do, rather than the fault.
  const titleOf = (h) => (simple ? h.cue || h.title : h.title);
  const list = rows.length
    ? el('div', { class: 'entries' }, rows.map((r) => el('button', { type: 'button', class: 'entry', onClick: () => onOpen(r.id) },
      el('span', { class: 'kicker muted' }, fmtDate(r.date)),
      el('span', { class: 'entry-title' }, r.coaching && r.coaching.headline ? titleOf(r.coaching.headline) : 'Swing'),
      el('span', { class: 'caption' }, simple
        ? `${clubLabel(r.club)}${r.note ? ` · ${r.note}` : ''}`
        : `${clubLabel(r.club)}, ${viewLabel(r.view)}${r.note ? `. ${r.note}` : ''}`))))
    : el('p', { class: 'muted' }, all.length ? 'No saved swings match this filter.' : simple ? 'No saved swings yet. Check a swing and save it to start your history.' : 'No saved swings yet. Analyse a clip and save it to start a history.');
  const angles = simple
    ? [['all', 'All'], ['dtl', simpleViewLabel('dtl')], ['fo', simpleViewLabel('fo')]]
    : [['all', 'All'], ['fo', 'Face-on'], ['dtl', 'Down-the-line']];
  const trends = renderTrends(rows);

  const count = all.length === 1 ? '1 saved swing' : `${all.length} saved swings`;
  root.replaceChildren(
    el('div', { class: 'page' },
      el('section', { class: 'sec' },
        hero('History'),
        el('p', { class: 'muted' }, `${count}, kept in this browser only.`)),
      all.length ? el('section', { class: 'sec' },
        el('h2', { class: 'kicker' }, 'Club'),
        select([['all', 'All clubs'], ...CLUB_LIST.filter((c) => all.some((r) => r.club === c.id)).map((c) => [c.id, c.label])], state.club, (v) => { state.club = v; rerender(); }),
        el('h2', { class: 'kicker' }, 'Angle'),
        chips(angles, state.view, (v) => { state.view = v; rerender(); })) : null,
      el('section', { class: 'sec' }, list),
      simple ? el('details', { class: 'more' }, el('summary', {}, 'Trends, for keen players'), trends) : trends));
}

function renderTrends(rows) {
  const ordered = rows.slice().reverse(); // oldest first
  if (ordered.length < 2) return section('Trends', el('p', { class: 'muted' }, 'Trends appear once two or more swings of the same club and angle are saved.'));
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
      el('div', { class: 'spark-head' },
        el('span', { class: 'name' }, NORMS[id] ? NORMS[id].label : id),
        el('span', { class: 'last' },
          el('span', {}, fmt(last.value, last.unit)),
          last.band && last.band !== 'na' ? el('span', { class: `pill ${last.band}` }, last.band) : null)),
      sparkline(points.map((p) => p.value))));
  }
  return section(`Trend over ${ordered.length} swings`,
    el('p', { class: 'caption' }, 'Oldest on the left, newest on the right. The filter above picks which swings count.'),
    lines.length ? el('div', { class: 'sparks' }, lines) : el('p', { class: 'muted' }, 'No shared metrics between these swings yet.'));
}

export function sparkline(values, w = 320, h = 32) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = values.length === 1 ? w / 2 : (i / (values.length - 1)) * (w - 8) + 4;
    const y = h - 4 - ((v - min) / span) * (h - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const lastPt = pts[pts.length - 1].split(',');
  return svg('svg', { viewBox: `0 0 ${w} ${h}`, 'aria-hidden': 'true' },
    svg('polyline', { points: pts.join(' '), fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linejoin': 'miter', 'vector-effect': 'non-scaling-stroke' }),
    svg('rect', { x: Number(lastPt[0]) - 3.5, y: Number(lastPt[1]) - 3.5, width: 7, height: 7, fill: 'currentColor' }));
}
