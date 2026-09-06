function esc(value = '') {
  return String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function asIcsDate(date) {
  return String(date || '').replaceAll('-', '');
}

export function remindersToIcs(reminders = [], calendarName = 'GrowUP My Children') {
  const events = reminders.filter((item) => item?.date && item?.title).map((item, index) => [
    'BEGIN:VEVENT',
    `UID:${esc(item.id || `growup-${index}`)}@growup-mychildren`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`,
    `DTSTART;VALUE=DATE:${asIcsDate(item.date)}`,
    `SUMMARY:${esc(item.title)}`,
    item.type ? `CATEGORIES:${esc(item.type)}` : null,
    'END:VEVENT'
  ].filter(Boolean).join('\r\n'));
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GrowUP My Children//VI', `X-WR-CALNAME:${esc(calendarName)}`, ...events, 'END:VCALENDAR', ''].join('\r\n');
}
