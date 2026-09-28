export function dollarsToCents(value) {
  if (typeof value !== 'string' || !/^\d+(\.\d{1,2})?$/.test(value)) {
    throw new Error('Enter USD dollars with at most two decimal places.');
  }
  const [whole, fraction = ''] = value.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents < 1 || cents > 100000000) {
    throw new Error('Budget must be between $0.01 and $1,000,000 USD.');
  }
  return cents;
}

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function displayDate(value) {
  if (!validDate(value)) throw new Error('Invalid date.');
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

export function money(cents) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: cents % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

// A revision guard protects every completion, including non-abortable requests.
export function createRequestGate() {
  let revision = 0;
  return {
    invalidate() { revision += 1; },
    begin() { return ++revision; },
    isCurrent(token) { return token === revision; },
  };
}
