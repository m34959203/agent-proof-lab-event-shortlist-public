// Original US fictional fixtures, authored September 26, 2026. No real listings,
// inherited records, price conversions, or researched market-rate claims.
export const catalogVersion = 'us-synthetic-v1';
export const calendar = { start: '2026-09-23', end: '2026-12-31' };
export const locations = [
  { id: 'austin-tx', city: 'Austin', state: 'TX', timeZone: 'America/Chicago' },
  { id: 'chicago-il', city: 'Chicago', state: 'IL', timeZone: 'America/Chicago' },
];
export const eventFormats = ['Conference', 'Corporate event', 'Wedding', 'Birthday', 'Anniversary'];
export const serviceLanguages = ['English', 'Spanish'];
// Independently selected sample USD cents, not a conversion of any old catalog.
const groups = [
  ['Event host/MC', 14, 82500, 6, 'moderates panels and introduces speakers'],
  ['Photographer', 10, 112550, 8, 'documents people and event details in still images'],
  ['Event venue', 8, 180000, 10, 'provides an indoor event space with a stage area'],
  ['Videographer', 5, 145000, 8, 'records talks and edits event highlight footage'],
  ['Florist', 3, 42500, null, 'creates table arrangements with seasonal flower palettes'],
  ['Event decorator', 4, 65000, null, 'plans backdrop colors and table decorations'],
  ['Wedding officiant', 3, 32500, 2, 'leads a personalized wedding ceremony'],
  ['Musician', 4, 47500, 4, 'plays instrumental sets during arrivals and breaks'],
  ['Photo booth', 4, 55000, 5, 'offers a staffed photo station with simple props'],
  ['Live band', 5, 165000, 5, 'performs a live ensemble set with scheduled breaks'],
  ['Performer', 3, 72500, 3, 'presents a short stage performance'],
  ['Event favors', 3, 22500, null, 'prepares small keepsakes for guests'],
];
const styles = ['Stillwater Demo', 'Marigold Demo', 'Juniper Demo', 'Northlight Demo', 'Copperleaf Demo', 'Daybreak Demo'];
export const categories = groups.map(g => g[0]);
export const catalog = groups.flatMap(([category, count, baseCents, maxHours, service], group) =>
  Array.from({ length: count }, (_, i) => {
    const location = locations[category !== 'Florist' && i % 3 === 2 ? 1 : 0];
    const style = styles[(i + group) % styles.length];
    const busyDates = [];
    for (let day = 0; day < 100; day++) {
      const date = new Date(Date.UTC(2026, 8, 23 + day)).toISOString().slice(0, 10);
      if ((day * 19 + i * 31 + group * 7) % 11 < 3) busyDates.push(date);
    }
    const formats = category === 'Wedding officiant' ? ['Wedding'] : i % 6 === 1 ? ['Wedding', 'Birthday', 'Anniversary'] : [...eventFormats];
    const languages = i % 5 === 4 ? ['Spanish'] : i % 3 === 2 ? ['English', 'Spanish'] : ['English'];
    const setting = formats.includes('Conference') ? 'conferences and celebrations' : 'weddings and celebrations';
    const spoken = ['Event host/MC', 'Wedding officiant', 'Performer'].includes(category);
    const visual = ['Florist', 'Event decorator', 'Event favors'].includes(category);
    const tone = spoken ? [
      'Calm pacing and clear presentations with pauses for questions.',
      'High-energy programs include games and dancing.',
      'A relaxed family atmosphere with time for conversation.',
      'Formal programs follow a detailed speaking schedule.',
      'Introductions follow a prepared running order.',
      'Quiet delivery with short transitions between program segments.',
    ] : visual ? [
      'Calm, understated styling uses simple shapes and muted colors.',
      'Bright colors and playful patterns suit lively celebrations.',
      'Relaxed family table settings use small coordinated details.',
      'Formal settings use repeating colors and ordered arrangements.',
      'Custom color palettes coordinate with the event theme.',
      'Quiet visual details leave room for the rest of the event decor.',
    ] : [
      'Designed for calm event settings with planned presentation breaks.',
      'Designed for high-energy settings with games and dancing.',
      'Designed for relaxed family gatherings and conversation.',
      'Designed for formal settings with a clear event schedule.',
      'Coordinates service timing with the event program.',
      'Designed for quiet programs with short scheduled segments.',
    ];
    const displayNoun = category === 'Event host/MC' ? 'event host/MC' : category === 'Event favors' ? 'event favor supplier' : category.toLowerCase();
    return {
      id: `us-v1-${String(group + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
      anon_name: `${style} ${category} ${i + 1}`,
      categories: [category], locationId: location.id, city: location.city, state: location.state,
      timeZone: location.timeZone, city_imputed: false, synthetic: true,
      priceFromUsdCents: baseCents + i * 13750, price_imputed: false,
      event_formats: formats,
      languages,
      max_hours: maxHours === null ? null : maxHours + i % 2,
      busy_dates: busyDates,
      description: `This fictional ${displayNoun} ${service} for ${setting}. ${tone[(i + group) % styles.length]} Service languages listed: ${languages.join(" and ")}.`,
      provenance: 'Original fictional US demo · us-synthetic-v1 · illustrative prices',
    };
  }));
