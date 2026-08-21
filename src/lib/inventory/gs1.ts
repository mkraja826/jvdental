export type ParsedGs1Scan = {
  gtin: string | null;
  lot: string | null;
  expiry: string | null;
  serial: string | null;
  isGs1: boolean;
};

export function normalizeGtin(value: string | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 14 ? digits.padStart(14, "0") : "";
}

function gs1ExpiryToIso(value: string) {
  if (!/^\d{6}$/.test(value)) return null;
  const year = 2000 + Number(value.slice(0, 2));
  const month = Number(value.slice(2, 4));
  let day = Number(value.slice(4, 6));
  if (month < 1 || month > 12) return null;
  if (day === 0) day = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > maxDay) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseParenthesizedGs1(raw: string): ParsedGs1Scan | null {
  if (!raw.includes("(")) return null;
  const values = new Map<string, string>();
  const matches = [...raw.matchAll(/\((01|10|17|21)\)(.*?)(?=\((?:01|10|17|21)\)|$)/g)];
  for (const match of matches) values.set(match[1], match[2].trim());
  if (!values.size) return null;
  return {
    gtin: values.get("01") ?? null,
    lot: values.get("10") ?? null,
    expiry: values.get("17") ? gs1ExpiryToIso(values.get("17")!) : null,
    serial: values.get("21") ?? null,
    isGs1: true,
  };
}

function parseCompactGs1(raw: string): ParsedGs1Scan | null {
  const source = raw.replace(/^\]d2/i, "");
  const values = new Map<string, string>();
  let index = 0;

  while (index < source.length) {
    if (source[index] === "\u001d") {
      index += 1;
      continue;
    }

    const ai = source.slice(index, index + 2);
    if (ai === "01") {
      const value = source.slice(index + 2, index + 16);
      if (!/^\d{14}$/.test(value)) break;
      values.set(ai, value);
      index += 16;
      continue;
    }
    if (ai === "17") {
      const value = source.slice(index + 2, index + 8);
      if (!/^\d{6}$/.test(value)) break;
      values.set(ai, value);
      index += 8;
      continue;
    }
    if (ai === "10" || ai === "21") {
      const start = index + 2;
      const separator = source.indexOf("\u001d", start);
      const end = separator === -1 ? source.length : separator;
      const value = source.slice(start, end).trim();
      if (!value) break;
      values.set(ai, value);
      index = separator === -1 ? source.length : separator + 1;
      continue;
    }
    break;
  }

  if (!values.size) return null;
  return {
    gtin: values.get("01") ?? null,
    lot: values.get("10") ?? null,
    expiry: values.get("17") ? gs1ExpiryToIso(values.get("17")!) : null,
    serial: values.get("21") ?? null,
    isGs1: true,
  };
}

export function parseGs1Scan(raw: string): ParsedGs1Scan {
  const clean = raw.trim();
  const parsed = parseParenthesizedGs1(clean) ?? parseCompactGs1(clean);
  if (parsed) return parsed;
  const gtin = normalizeGtin(clean);
  return { gtin: gtin || null, lot: null, expiry: null, serial: null, isGs1: false };
}
