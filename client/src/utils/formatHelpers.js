// number, money and date formatting for widgets
import { fieldKind } from "./dashboardConfig";

export function formatNumber(value, decimals = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatMoney(value, decimals = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `$ ${formatNumber(number, decimals)}`;
}

// kpi value with the chosen format and decimals
export function formatKpi(value, format = "number", decimals = 0) {
  return format === "currency"
    ? formatMoney(value, decimals)
    : formatNumber(value, decimals);
}

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

// table cell text for each field type
export function formatCell(field, value) {
  if (value === undefined || value === null || value === "") return "—";
  const kind = fieldKind(field);
  if (kind === "currency") return formatMoney(value);
  if (kind === "date") return formatDate(value);
  return value;
}

// short number for axis ticks and bar labels
export function formatShort(value, money = false) {
  const number = Number(value);
  const text =
    Math.abs(number) >= 1000000
      ? `${+(number / 1000000).toFixed(1)}M`
      : Math.abs(number) >= 10000
      ? `${+(number / 1000).toFixed(1)}k`
      : `${+number.toFixed(2)}`;
  return money ? `$ ${text}` : text;
}
