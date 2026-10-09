const DEFAULT_DISPLAY_TIME_ZONE = "Asia/Jakarta";
const DEFAULT_STORE_TIME_ZONE = DEFAULT_DISPLAY_TIME_ZONE;

const STORE_TIMEZONE_MAP: Record<string, string> = {
  "2011": "Asia/Jakarta",
  "2440": "Asia/Makassar",
  "1399": "Asia/Jayapura",
};

function hasExplicitTimeZone(value: string) {
  return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value.trim());
}

function getTimeZoneOffsetMinutes(timeZone: string, date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const timeZoneName = formatter.formatToParts(date).find((part) => part.type === "timeZoneName")?.value ?? "GMT+7";
  const match = timeZoneName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!match) {
    return 0;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  return sign * (hours * 60 + minutes);
}

function readLocalDateParts(value: string) {
  const normalized = value.trim();
  const match = normalized.match(/^\s*(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?\s*$/);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
  return {
    year: Number(year),
    month: Number(month) - 1,
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  };
}

function convertToUtc(dateValue: string, fromTimeZone: string) {
  const parts = readLocalDateParts(dateValue);
  if (!parts) {
    return new Date(dateValue);
  }

  const sourceInstant = Date.UTC(
    parts.year,
    parts.month,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  const sourceOffsetMinutes = getTimeZoneOffsetMinutes(fromTimeZone, new Date(sourceInstant));
  return new Date(sourceInstant - sourceOffsetMinutes * 60_000);
}

function formatDateParts(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

function formatDateOnlyParts(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  }).format(date);
}

export function getStoreTimeZone(storeCode?: string | null) {
  const normalized = (storeCode ?? "").trim();
  return STORE_TIMEZONE_MAP[normalized] ?? DEFAULT_STORE_TIME_ZONE;
}

export function formatApiDateTime(value?: string | null, timeZoneOverride?: string | null) {
  if (!value) return "-";

  const normalized = value.trim();
  const sourceTimeZone = timeZoneOverride?.trim() || DEFAULT_STORE_TIME_ZONE;

  let date: Date | null = null;

  if (!hasExplicitTimeZone(normalized)) {
    date =
      sourceTimeZone === "UTC"
        ? new Date(`${normalized}Z`)
        : convertToUtc(normalized, sourceTimeZone);
  } else {
    date = new Date(normalized);
  }

  if (!date || Number.isNaN(date.getTime())) return "-";

  const formatted = formatDateParts(date, DEFAULT_DISPLAY_TIME_ZONE);
  return `${formatted} WIB`;
}

export function formatApiDateOnly(value?: string | null, timeZoneOverride?: string | null) {
  if (!value) return "-";

  const normalized = value.trim();
  const sourceTimeZone = timeZoneOverride?.trim() || DEFAULT_STORE_TIME_ZONE;

  let date: Date | null = null;

  if (!hasExplicitTimeZone(normalized)) {
    date = convertToUtc(normalized, sourceTimeZone);
  } else {
    date = new Date(normalized);
  }

  if (!date || Number.isNaN(date.getTime())) return "-";

  return formatDateOnlyParts(date, DEFAULT_DISPLAY_TIME_ZONE);
}
