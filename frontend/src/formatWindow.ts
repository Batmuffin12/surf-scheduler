const ZONE = 'Asia/Jerusalem'
const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: ZONE })
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: ZONE })

/** "Fri 6 Nov · 07:00–09:00", Israel time (decided in #15) */
export function formatWindow(start: string, end: string): string {
  const day = dayFormat.format(new Date(start)).replace(',', '')
  return `${day} · ${timeFormat.format(new Date(start))}–${timeFormat.format(new Date(end))}`
}
