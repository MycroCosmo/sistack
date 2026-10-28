import { readFile } from 'node:fs/promises';
export const schema = JSON.parse(await readFile(new URL('../../schemas/manifest.schema.json', import.meta.url), 'utf8'));
const keywords = new Set(['$schema', '$id', '$defs', '$ref', 'type', 'required', 'properties', 'additionalProperties', 'const', 'enum', 'minLength', 'pattern', 'format', 'items', 'uniqueItems', 'minimum', 'maximum']);
const types = {
  object: (v) => v !== null && typeof v === 'object' && !Array.isArray(v),
  array: Array.isArray, string: (v) => typeof v === 'string', null: (v) => v === null,
  integer: Number.isInteger
};

function dateTime(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!m) return false;
  const [, y, month, day, hour, minute, second, , offsetHour = 0, offsetMinute = 0] = m;
  return +month >= 1 && +month <= 12 && +day >= 1 && +day <= new Date(Date.UTC(+y, +month, 0)).getUTCDate()
    && +hour < 24 && +minute < 60 && +second < 60 && +offsetHour < 24 && +offsetMinute < 60;
}

export function validateManifest(value, definition = schema) {
  const errors = [];
  function visit(v, s, location) {
    for (const key of Object.keys(s)) if (!keywords.has(key)) throw new Error('지원하지 않는 스키마 키워드');
    if (s.$ref) {
      if (!s.$ref.startsWith('#/$defs/') || !definition.$defs?.[s.$ref.slice(8)]) throw new Error('지원하지 않는 스키마 참조');
      return visit(v, definition.$defs[s.$ref.slice(8)], location);
    }
    if (s.type && ![s.type].flat().some((t) => types[t]?.(v))) { errors.push(`${location}: type`); return; }
    if ('const' in s && v !== s.const) errors.push(`${location}: const`);
    if (s.enum && !s.enum.includes(v)) errors.push(`${location}: enum`);
    if (typeof v === 'string') {
      if (s.minLength && [...v].length < s.minLength) errors.push(`${location}: minLength`);
      if (s.pattern && !new RegExp(s.pattern, 'u').test(v)) errors.push(`${location}: pattern`);
      if (s.format && (s.format !== 'date-time' || !dateTime(v))) errors.push(`${location}: format`);
    }
    if (typeof v === 'number' && (v < (s.minimum ?? -Infinity) || v > (s.maximum ?? Infinity))) errors.push(`${location}: range`);
    if (Array.isArray(v)) {
      if (s.uniqueItems && new Set(v.map((item) => JSON.stringify(item))).size !== v.length) errors.push(`${location}: uniqueItems`);
      if (s.items) v.forEach((item, i) => visit(item, s.items, `${location}[${i}]`));
    }
    if (types.object(v)) {
      for (const key of s.required ?? []) if (!Object.hasOwn(v, key)) errors.push(`${location}.${key}: required`);
      for (const [key, item] of Object.entries(v)) {
        if (Object.hasOwn(s.properties ?? {}, key)) visit(item, s.properties[key], `${location}.${key}`);
        else if (s.additionalProperties === false) errors.push(`${location}: additionalProperties`);
        else if (types.object(s.additionalProperties)) visit(item, s.additionalProperties, `${location}.*`);
      }
    }
  }
  visit(value, definition, '$');
  return errors;
}
