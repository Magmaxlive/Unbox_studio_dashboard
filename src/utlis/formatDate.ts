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
