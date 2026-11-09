// Helpers for turning <input type="date"> values ("YYYY-MM-DD") into
// timestamps in the viewer's local timezone.
//
// Never use new Date("YYYY-MM-DD"): JavaScript parses date-only strings
// as UTC midnight, which shifts day boundaries for non-UTC viewers.

function parseDateInput(value:string) : [number, number, number] | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;

    return [Number(match[1]), Number(match[2]), Number(match[3])];
}

// "2026-11-06" -> local midnight on 6 Nov, as an ISO (UTC) string.
export function startOfLocalDayISO(value:string) : string | null {
    const parts = parseDateInput(value);
    if (!parts) return null;

    const [year, month, day] = parts;
    return new Date(year, month - 1, day).toISOString();
}

// "2026-11-06" -> local midnight on 7 Nov, as an ISO (UTC) string.
// Used as an exclusive upper bound, so the whole selected day is included.
export function startOfNextLocalDayISO(value:string) : string | null {
    const parts = parseDateInput(value);
    if (!parts) return null;

    const [year, month, day] = parts;
    return new Date(year, month - 1, day + 1).toISOString();
}

// Today's local date in "YYYY-MM-DD" format, for <input type="date"> max.
export function todayInputValue() : string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}