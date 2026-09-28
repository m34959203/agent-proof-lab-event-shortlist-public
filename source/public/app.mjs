import { dollarsToCents, displayDate, money, createRequestGate } from './shared.mjs';

const form = document.querySelector('#brief');
const fields = document.querySelector('#fields');
const results = document.querySelector('#results');
const status = document.querySelector('#status');
const panel = document.querySelector('.results-panel');
const gate = createRequestGate();
let controller;

// All catalog and user text is inserted as text, never interpreted as markup.
function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function list(items) {
  const node = el('ul');
  items.forEach(text => node.append(el('li', text)));
  return node;
}
function invalidate() {
  gate.invalidate();
  controller?.abort();
  results.replaceChildren();
  panel.setAttribute('aria-busy', 'false');
  status.textContent = 'Brief changed. Submit to find options for these requirements.';
}
form.addEventListener('input', invalidate);
form.addEventListener('change', invalidate);

function readBrief() {
  const data = new FormData(form);
  const brief = {
    locationId: data.get('locationId'), date: data.get('date'),
    eventType: data.get('eventType'), category: data.get('category'),
    budgetUsdCents: dollarsToCents(data.get('budget')), style: data.get('style'),
  };
  if (data.get('language')) brief.language = data.get('language');
  if (data.get('hours') !== '') brief.hours = Number(data.get('hours'));
  return brief;
}

function render(data) {
  const brief = data.brief;
  results.append(el('p', `${displayDate(brief.date)} · ${brief.eventType} · `
    + `${money(brief.budgetUsdCents)} USD maximum starting price`, 'summary'));
  if (data.outcome === 'no-category') {
    status.textContent = 'No such category in this city’s demo catalog. Try another service or city.';
  } else if (data.outcome === 'no-eligible') {
    status.textContent = 'No options meet all your requirements. Review the exclusions, '
      + 'then change a requirement if your event allows it.';
  } else {
    status.textContent = `${data.cards.length} option${data.cards.length === 1 ? '' : 's'} shown from `
      + `${data.eligibleCount} eligible profile${data.eligibleCount === 1 ? '' : 's'}. `
      + 'Ordered by description similarity; style wishes remain unverified.';
  }
  data.cards.forEach((card, index) => {
    const article = el('article', undefined, 'card');
    const top = el('div', undefined, 'card-top');
    top.append(el('span', `0${index + 1}`, 'rank'), el('span', 'Fictional profile', 'tag'));
    article.append(top, el('h3', card.name), el('p', `${card.category} · ${card.city}, ${card.state}`, 'meta'));
    article.append(el('p', `${money(card.priceFromUsdCents)} `, 'price'));
    article.lastChild.append(el('span', 'USD starting price'));
    article.append(el('h4', 'Catalog eligibility'), list(card.facts));
    const details = el('details');
    details.append(el('summary', 'See the source and what still needs confirmation'));
    details.append(el('h4', 'Exact source description'), el('blockquote', card.description),
      el('p', card.provenance, 'hint'), el('h4', 'Unverified wishes'), list(card.unknowns),
      el('h4', 'Questions to ask'), list(card.questions));
    article.append(details);
    results.append(article);
  });
  if (data.exclusions.length) {
    const details = el('details', undefined, 'exclusions');
    details.append(el('summary', `${data.exclusions.length} profile${data.exclusions.length === 1 ? '' : 's'} excluded · See why`));
    data.exclusions.forEach(p => {
      details.append(el('h4', p.name), list(p.reasons.map(reason => reason.text)));
    });
    results.append(details);
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  invalidate();
  const token = gate.begin();
  controller = new AbortController();
  try {
    const brief = readBrief();
    panel.setAttribute('aria-busy', 'true');
    status.textContent = 'Checking catalog requirements, then comparing eligible descriptions…';
    const response = await fetch('/api/recommend', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brief), signal: controller.signal,
    });
    const data = await response.json();
    if (!gate.isCurrent(token)) return;
    if (!response.ok) throw new Error(data.error || 'The recommendation request failed.');
    render(data);
  } catch (error) {
    if (!gate.isCurrent(token)) return;
    status.textContent = `${error.message} No recommendations were generated. `
      + 'Review your brief or check the local model setup, then retry.';
  } finally {
    if (gate.isCurrent(token)) panel.setAttribute('aria-busy', 'false');
  }
});

function demo(date) {
  invalidate();
  for (const [name, value] of Object.entries({
    locationId: 'austin-tx', date, eventType: 'Conference', category: 'Event host/MC',
    budget: '2000', language: 'English', hours: '4',
    style: 'Calm pacing and clear presentations, without party games.',
  })) form.elements.namedItem(name).value = value;
  status.textContent = `Conference example set to ${displayDate(date)}. Submit to compare options.`;
}
document.querySelector('#oct17').addEventListener('click', () => demo('2026-10-17'));
document.querySelector('#oct18').addEventListener('click', () => demo('2026-10-18'));

try {
  const response = await fetch('/api/catalog');
  if (!response.ok) throw new Error('Catalog could not be loaded.');
  const config = await response.json();
  for (const [id, values] of [
    ['location', config.locations.map(l => [l.id, `${l.city}, ${l.state}`])],
    ['eventType', config.eventFormats.map(x => [x, x])],
    ['category', config.categories.map(x => [x, x])],
    ['language', [['', 'No preference'], ...config.serviceLanguages.map(x => [x, x])]],
  ]) {
    const select = document.getElementById(id);
    values.forEach(([value, label]) => {
      const option = el('option', label);
      option.value = value;
      select.append(option);
    });
  }
  fields.disabled = false;
  document.querySelector('#oct17').disabled = false;
  document.querySelector('#oct18').disabled = false;
  form.elements.namedItem('language').value = 'English';
  status.textContent = 'Your Austin conference brief is ready. Find your shortlist to begin.';
  const empty = el('div', undefined, 'empty');
  empty.append(el('span', '↗', 'empty-icon'), el('h3', 'A few options. Clear next steps.'),
    el('p', 'We check city, date, starting price, event type, language and duration first. '
      + 'The configured local model then orders the eligible descriptions.'));
  results.append(empty);
} catch {
  status.textContent = 'The local catalog could not be loaded. Refresh to retry.';
}
