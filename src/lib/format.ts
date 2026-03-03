export function formatCurrency(value: number | null | undefined, locale: string) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(value);
}

export function formatDate(value: string | Date, locale: string) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}
