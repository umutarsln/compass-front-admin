import { format } from "date-fns"
import { tr } from "date-fns/locale"

/** Tam tarih: "3 Şubat 2025" */
export function formatDateFull(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date + "T12:00:00") : date
  return format(d, "d MMMM yyyy", { locale: tr })
}

/** Kısa tarih (grafik ekseni): "3 Şubat" */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date + "T12:00:00") : date
  return format(d, "d MMMM", { locale: tr })
}

/** Tarih + saat: "3 Şubat 2025, 14:30" */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "d MMMM yyyy, HH:mm", { locale: tr })
}

/** Aralık metni: "20 Ocak 2025 – 3 Şubat 2025" */
export function formatDateRange(from: string, to: string): string {
  return `${formatDateFull(from)} – ${formatDateFull(to)}`
}
