const dateFormatter = new Intl.DateTimeFormat(undefined,{
    day : 'numeric',
    month : 'short',
    year : 'numeric'
})


function formatDate(value : string | null) : string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return dateFormatter.format(date)
}

export default formatDate


// e.g. "12 Nov 2026, 5:30 pm" in the viewer's locale and timezone
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    day : 'numeric',
    month : 'short',
    year : 'numeric',
    hour : 'numeric',
    minute : '2-digit',
});

export function formatDateTime(value: string | null): string {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return dateTimeFormatter.format(date);
}
