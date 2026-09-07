function esc(value = '') {
  return String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function asIcsDate(date) {
  return String(date || '').replaceAll('-', '');
}

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function calendar(events, calendarName = 'GrowUP My Children') {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GrowUP My Children//VI', `X-WR-CALNAME:${esc(calendarName)}`, ...events, 'END:VCALENDAR', ''].join('\r\n');
}

export function remindersToIcs(reminders = [], calendarName = 'GrowUP My Children') {
  const events = reminders.filter((item) => item?.date && item?.title).map((item, index) => [
    'BEGIN:VEVENT',
    `UID:${esc(item.id || `growup-${index}`)}@growup-mychildren`,
    `DTSTAMP:${stamp()}`,
    `DTSTART;VALUE=DATE:${asIcsDate(item.date)}`,
    `SUMMARY:${esc(item.title)}`,
    item.type ? `CATEGORIES:${esc(item.type)}` : null,
    'END:VEVENT'
  ].filter(Boolean).join('\r\n'));
  return calendar(events, calendarName);
}

export function familyPlanItemsToIcs(items = [], options = {}) {
  const selectedIds = new Set(Array.isArray(options.itemIds) ? options.itemIds.filter(Boolean) : []);
  const selectedChildIds = new Set(Array.isArray(options.childIds) ? options.childIds.filter(Boolean) : []);
  const events = (Array.isArray(items) ? items : [])
    .filter((item) => item?.date && item?.title)
    .filter((item) => !selectedIds.size || selectedIds.has(item.id))
    .filter((item) => !selectedChildIds.size || selectedChildIds.has(item.childId))
    .map((item, index) => [
      'BEGIN:VEVENT',
      `UID:${esc(item.id || `growup-family-plan-${index}`)}@growup-mychildren`,
      `DTSTAMP:${stamp()}`,
      `DTSTART;VALUE=DATE:${asIcsDate(item.date)}`,
      `SUMMARY:${esc(item.title)}`,
      'CATEGORIES:GrowUP Family Plan',
      Number(item.minutes) > 0 ? `X-GROWUP-PLANNED-MINUTES:${Math.round(Number(item.minutes))}` : null,
      'END:VEVENT'
    ].filter(Boolean).join('\r\n'));
  return calendar(events, options.calendarName || 'GrowUP - Kế hoạch gia đình');
}
