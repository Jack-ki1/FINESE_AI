export type SemanticType =
  | 'identifier' | 'zip' | 'phone' | 'email' | 'url' | 'currency'
  | 'boolean' | 'categorical' | 'numeric' | 'datetime' | 'text' | 'empty';

const ZIP_RE = /^\d{5}(-\d{4})?$/;
const PHONE_RE = /^[\+\(\)\-\.\s\d]{7,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^(https?:\/\/|www\.)/i;
const CURRENCY_RE = /^[\$€£¥₹]\s?-?\d/;
const BOOL_VALUES = new Set(['true', 'false', 'yes', 'no', 'y', 'n', '0', '1', 't', 'f']);

function looksNumeric(v: any): boolean {
  if (v === '' || v === null || v === undefined || typeof v === 'boolean') return false;
  const n = Number(v);
  return !isNaN(n) && isFinite(n);
}

export function detectSemanticType(col: string, values: any[]): SemanticType {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'empty';
  const total = nonNull.length;
  const isIdName = /(^id$|_id$|^uuid$|guid|hash|key)/i.test(col);
  const isZipName = /(^zip$|zipcode|postal|^postcode$)/i.test(col);
  const isPhoneName = /(phone|mobile|fax|tel)/i.test(col);
  const isEmailName = /(email|e-mail)/i.test(col);
  const isUrlName = /(url|link|href|website|domain)/i.test(col);
  const isCurrencyName = /(price|cost|revenue|amount|salary|wage|fee|charge|usd|eur|gbp)/i.test(col);

  const strs = nonNull.map(String);
  const uniqueRatio = new Set(strs).size / total;

  if (isIdName && uniqueRatio > 0.9) return 'identifier';
  if (uniqueRatio > 0.95 && strs.every((s) => s.length >= 6 && s.length <= 64)) return 'identifier';

  const matchRatio = (re: RegExp) => strs.filter((s) => re.test(s)).length / total;
  const boolRatio = strs.filter((s) => BOOL_VALUES.has(s.toLowerCase())).length / total;

  if (isZipName || matchRatio(ZIP_RE) > 0.8) return 'zip';
  if (isEmailName || matchRatio(EMAIL_RE) > 0.8) return 'email';
  if (isUrlName || matchRatio(URL_RE) > 0.8) return 'url';
  if (matchRatio(CURRENCY_RE) > 0.8 || (isCurrencyName && nonNull.every(looksNumeric))) return 'currency';
  if (isPhoneName && matchRatio(PHONE_RE) > 0.6) return 'phone';
  if (boolRatio > 0.95) return 'boolean';

  const numCount = nonNull.filter(looksNumeric).length;
  if (numCount / total > 0.9) {
    if (uniqueRatio > 0.95 && strs.every((s) => /^\d+$/.test(s))) return 'identifier';
    return 'numeric';
  }
  const dateCount = nonNull.filter((v) => !isNaN(Date.parse(String(v))) && String(v).length > 4).length;
  if (dateCount / total > 0.85) return 'datetime';

  if (uniqueRatio < 0.25 && new Set(strs).size <= 50) return 'categorical';
  return 'text';
}

export function detectType(values: any[]): 'numeric' | 'categorical' | 'text' | 'datetime' | 'empty' {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'empty';
  const numCount = nonNull.filter((v) => !isNaN(Number(v)) && v !== '' && v !== true && v !== false).length;
  if (numCount / nonNull.length > 0.8) return 'numeric';
  const unique = new Set(nonNull.map(String));
  if (unique.size / nonNull.length < 0.25 && unique.size <= 40) return 'categorical';
  const dateCount = nonNull.filter((v) => !isNaN(Date.parse(String(v))) && String(v).length > 4).length;
  if (dateCount / nonNull.length > 0.8) return 'datetime';
  return 'text';
}
