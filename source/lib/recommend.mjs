import {
  catalog, catalogVersion, calendar, locations, categories,
  eventFormats, serviceLanguages,
} from '../data/catalog.mjs';
import { validDate, displayDate, money } from '../public/shared.mjs';

export const config = {
  catalogVersion, calendar, locations, categories, eventFormats, serviceLanguages,
  limits: { budgetUsdCents: 100000000, hours: 24, styleCharacters: 4000 },
};

export class InputError extends Error {}
export function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new InputError('Send an event brief object.');
  }
  const keys = ['locationId', 'date', 'eventType', 'category',
    'budgetUsdCents', 'language', 'hours', 'style'];
  if (Object.keys(input).some(key => !keys.includes(key))) {
    throw new InputError('Unknown brief field. Use USD cents for the budget.');
  }
  for (const [key, values] of [
    ['locationId', locations.map(item => item.id)],
    ['eventType', eventFormats], ['category', categories],
  ]) {
    if (!values.includes(input[key])) throw new InputError(`Choose a valid ${key}.`);
  }
  if (!validDate(input.date) || input.date < calendar.start || input.date > calendar.end) {
    throw new InputError('Choose a real date from Sep 23 through Dec 31, 2026.');
  }
  if (!Number.isSafeInteger(input.budgetUsdCents) || input.budgetUsdCents < 1
      || input.budgetUsdCents > config.limits.budgetUsdCents) {
    throw new InputError('Budget must be integer USD cents from 1 to 100,000,000.');
  }
  if (input.language !== undefined && !serviceLanguages.includes(input.language)) {
    throw new InputError('Service language must be English or Spanish, or omitted.');
  }
  if (input.hours !== undefined && (typeof input.hours !== 'number'
      || !Number.isFinite(input.hours) || input.hours <= 0 || input.hours > 24)) {
    throw new InputError('On-site duration must be greater than 0 and at most 24 hours.');
  }
  if (input.style !== undefined && (typeof input.style !== 'string'
      || input.style.length > 4000)) {
    throw new InputError('Style brief must be text of at most 4,000 characters.');
  }
  return { ...input, style: input.style ?? '' };
}

export function filterPool(brief, records = catalog) {
  const pool = records.filter(p => p.locationId === brief.locationId
    && p.categories.includes(brief.category));
  const eligible = [];
  const exclusions = [];
  for (const p of pool) {
    const reasons = [];
    if (p.busy_dates.includes(brief.date)) reasons.push({
      code: 'busy', text: `Marked busy on ${displayDate(brief.date)} in the sample calendar.`,
    });
    if (p.priceFromUsdCents > brief.budgetUsdCents) reasons.push({
      code: 'budget', overBudgetUsdCents: p.priceFromUsdCents - brief.budgetUsdCents,
      text: `${money(p.priceFromUsdCents)} USD starting price exceeds your budget by `
        + `${money(p.priceFromUsdCents - brief.budgetUsdCents)} USD.`,
    });
    if (!p.event_formats.includes(brief.eventType)) reasons.push({
      code: 'eventType', text: `${brief.eventType} is not a listed event type.`,
    });
    if (brief.language && !p.languages.includes(brief.language)) reasons.push({
      code: 'language', text: `${brief.language} is not a listed service language.`,
    });
    if (brief.hours !== undefined && p.max_hours !== null && p.max_hours < brief.hours) {
      reasons.push({ code: 'duration', text: `Listed on-site maximum is ${p.max_hours} hours.` });
    }
    if (reasons.length) exclusions.push({ id: p.id, name: p.anon_name, reasons });
    else eligible.push(p);
  }
  return { poolCount: pool.length, eligible, exclusions };
}

export async function recommend(raw, embeddings, records = catalog) {
  const brief = validate(raw);
  const { poolCount, eligible, exclusions } = filterPool(brief, records);
  const base = { catalogVersion, brief, poolCount, eligibleCount: eligible.length, exclusions };
  if (!poolCount) return { ...base, outcome: 'no-category', cards: [] };
  if (!eligible.length) return { ...base, outcome: 'no-eligible', cards: [] };
  const location = locations.find(l => l.id === brief.locationId);
  const query = `${brief.eventType}; ${brief.category}; ${location.city}, ${location.state}; `
    + `language: ${brief.language ?? 'not requested'}; `
    + `on-site hours: ${brief.hours ?? 'not requested'}. Style wishes: ${brief.style}`;
  const vectors = await embeddings.embed([query, ...eligible.map(p => p.description)]);
  const ranked = eligible.map((p, index) => ({
    p, score: vectors[0].reduce((sum, x, j) => sum + x * vectors[index + 1][j], 0),
  })).sort((a, b) => b.score - a.score || (a.p.id < b.p.id ? -1 : a.p.id > b.p.id ? 1 : 0));
  const cards = ranked.slice(0, 3).map(({ p, score }) => ({
    id: p.id, name: p.anon_name, category: brief.category, city: p.city, state: p.state,
    synthetic: p.synthetic, priceFromUsdCents: p.priceFromUsdCents,
    headroomUsdCents: brief.budgetUsdCents - p.priceFromUsdCents,
    score, description: p.description, provenance: p.provenance,
    facts: [
      `${p.city}, ${p.state} · ${brief.category} is listed in this demo catalog.`,
      `Not marked busy on ${displayDate(brief.date)} in the sample calendar; confirm availability.`,
      `${money(p.priceFromUsdCents)} USD starting price leaves `
        + `${money(brief.budgetUsdCents - p.priceFromUsdCents)} USD before uncalculated fees.`,
      `${brief.eventType} is a listed event type.`,
      brief.language ? `${brief.language} is listed; real-world ability is unverified.`
        : `Listed service languages: ${p.languages.join(', ')}. No language filter requested.`,
      p.max_hours === null
        ? 'This service is not based on on-site attendance. An on-site duration is not verified.'
        : `Listed on-site maximum: ${p.max_hours} hours. `
          + (brief.hours === undefined ? 'No duration filter requested.'
            : `Your ${brief.hours}-hour request fits that limit.`),
    ],
    unknowns: [
      'Similarity orders eligible descriptions; it does not prove style fit, quality or availability.',
      ...(brief.style.trim() ? [`Unverified style wishes: ${brief.style}`] : []),
      'Shared descriptions do not mean a higher price buys better suitability.',
    ],
    questions: [
      `Can you confirm availability on ${displayDate(brief.date)} for a ${brief.eventType}?`,
      'What is the final USD quote, including taxes, travel, overtime, deposits and other fees?',
      ...(brief.style.trim() ? [`Can you accommodate these wishes, and describe how: ${brief.style}?`] : []),
      ...(brief.hours !== undefined ? [p.max_hours === null
        ? `This service is not based on attendance. What delivery or setup is included for a ${brief.hours}-hour event?`
        : `Does the quote include ${brief.hours} hours on site, and how are breaks handled?`] : []),
    ],
  }));
  return { ...base, outcome: 'options', model: embeddings.identity, cards };
}
