// The bag. Pure module: no DOM, safe in Node tests.
//
// Every club maps to three things: a band profile (which norm bands apply: the driver has
// its own tour setup numbers, everything else is measured against the iron bands because
// no published wood, hybrid or wedge setup numbers exist), a weight profile (which miss
// pattern the coach ranks for: long clubs share the driver's slice pattern, wedges are a
// contact game, the rest is the iron pattern), and a setup group (which setup facts to
// show). Club ids are stored on saved swings, so the four original ids never change.

export const GROUPS = Object.freeze({
  driver: 'Driver',
  wood: 'Fairway woods',
  hybrid: 'Hybrids',
  longIron: 'Long irons',
  midIron: 'Mid irons',
  shortIron: 'Short irons',
  wedge: 'Wedges',
  other: 'Other',
});

const C = (id, label, short, group, bandProfile, weightProfile) => Object.freeze({ id, label, short, group, bandProfile, weightProfile });

export const CLUB_LIST = Object.freeze([
  C('driver', 'Driver', 'Dr', 'driver', 'driver', 'driver'),
  C('3w', '3 wood', '3W', 'wood', 'iron', 'driver'),
  C('5w', '5 wood', '5W', 'wood', 'iron', 'driver'),
  C('7w', '7 wood', '7W', 'wood', 'iron', 'driver'),
  C('2h', '2 hybrid', '2H', 'hybrid', 'iron', 'iron'),
  C('3h', '3 hybrid', '3H', 'hybrid', 'iron', 'iron'),
  C('4h', '4 hybrid', '4H', 'hybrid', 'iron', 'iron'),
  C('5h', '5 hybrid', '5H', 'hybrid', 'iron', 'iron'),
  C('2i', '2 iron', '2i', 'longIron', 'iron', 'iron'),
  C('3i', '3 iron', '3i', 'longIron', 'iron', 'iron'),
  C('4i', '4 iron', '4i', 'longIron', 'iron', 'iron'),
  C('5i', '5 iron', '5i', 'longIron', 'iron', 'iron'),
  C('6i', '6 iron', '6i', 'midIron', 'iron', 'iron'),
  C('7i', '7 iron', '7i', 'midIron', 'iron', 'iron'),
  C('8i', '8 iron', '8i', 'midIron', 'iron', 'iron'),
  C('9i', '9 iron', '9i', 'shortIron', 'iron', 'iron'),
  C('pw', 'Pitching wedge', 'PW', 'wedge', 'iron', 'pw'),
  C('gw', 'Gap wedge', 'GW', 'wedge', 'iron', 'pw'),
  C('sw', 'Sand wedge', 'SW', 'wedge', 'iron', 'pw'),
  C('lw', 'Lob wedge', 'LW', 'wedge', 'iron', 'pw'),
  C('other', 'Other club', 'Other', 'other', 'iron', 'iron'),
]);

export const CLUB_BY_ID = Object.freeze(Object.fromEntries(CLUB_LIST.map((c) => [c.id, c])));
export const CLUB_IDS = Object.freeze(CLUB_LIST.map((c) => c.id));

/** A common 14-club bag less the putter (which the app cannot read). */
export const DEFAULT_BAG = Object.freeze(['driver', '3w', '5w', '4h', '5i', '6i', '7i', '8i', '9i', 'pw', 'gw', 'sw', 'lw']);

export function isClub(id) {
  return Object.prototype.hasOwnProperty.call(CLUB_BY_ID, id);
}

export function clubLabel(id) {
  const c = CLUB_BY_ID[id];
  return c ? c.label : String(id || 'Unknown club');
}

export function clubShort(id) {
  const c = CLUB_BY_ID[id];
  return c ? c.short : String(id || '?');
}

export function clubGroup(id) {
  const c = CLUB_BY_ID[id];
  return c ? c.group : 'other';
}

/** 'driver' or 'iron': which norm bands apply. */
export function bandProfile(id) {
  const c = CLUB_BY_ID[id];
  return c ? c.bandProfile : 'iron';
}

/** 'driver', 'iron' or 'pw': which ranking weights the coach uses. */
export function weightProfile(id) {
  const c = CLUB_BY_ID[id];
  return c ? c.weightProfile : 'iron';
}

/** Words for "measured against the bands for ...". */
export function clubWord(id) {
  switch (clubGroup(id)) {
    case 'driver': return 'the driver';
    case 'wood': return 'a fairway wood';
    case 'hybrid': return 'a hybrid';
    case 'wedge': return 'a wedge';
    default: return 'an iron';
  }
}

/** Clean a bag: known ids only, no 'other', no duplicates, in bag order. Empty falls back to the default. */
export function normaliseBag(list) {
  if (!Array.isArray(list)) return [...DEFAULT_BAG];
  const seen = new Set();
  const out = [];
  for (const c of CLUB_LIST) {
    if (c.id !== 'other' && list.includes(c.id) && !seen.has(c.id)) { seen.add(c.id); out.push(c.id); }
  }
  return out.length ? out : [...DEFAULT_BAG];
}

/** Clubs to offer on Home: the bag, plus the current club if it is not in the bag. */
export function clubsToOffer(bag, current) {
  const list = normaliseBag(bag);
  if (current && isClub(current) && !list.includes(current)) {
    return CLUB_LIST.filter((c) => list.includes(c.id) || c.id === current).map((c) => c.id);
  }
  return list;
}
