// The trial looks. Settings switches the app between the current design and three
// alternatives, each a stylesheet in looks/ layered over styles.css. Pure data, no DOM.
// index.html applies the saved look before the first paint and keeps its own copy of the
// ids and bar colours; a test checks the two agree.

export const LOOKS = Object.freeze([
  Object.freeze({ id: 'editorial', name: 'Current', blurb: 'White page, black type, a serif headline.', themeColor: '#FFFFFF', css: null }),
  Object.freeze({ id: 'launch', name: 'A · Launch Monitor', blurb: 'Dark panels, volt-lime, big condensed numbers.', themeColor: '#0C100F', css: 'looks/launch.css' }),
  Object.freeze({ id: 'tour', name: 'B · Tour', blurb: 'Black masthead, heavy italic headlines, vermilion.', themeColor: '#0B0B0B', css: 'looks/tour.css' }),
  Object.freeze({ id: 'yardage', name: 'C · Yardage Book', blurb: 'Caddie notebook: contour map, highlighter, typewriter numbers.', themeColor: '#EEF0E9', css: 'looks/yardage.css' }),
]);

export const LOOK_IDS = Object.freeze(LOOKS.map((l) => l.id));

/** The look with this id, or the current design when the id is unknown. */
export function lookById(id) {
  return LOOKS.find((l) => l.id === id) || LOOKS[0];
}
