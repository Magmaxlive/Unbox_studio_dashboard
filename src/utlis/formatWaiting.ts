// waiting 3 hours , 2 days 
export function formatWaiting(isoDate : string , now = Date.now()) : string {
    const minutes = Math.max(0, Math.floor((now - new Date(isoDate).getTime()) /60000 ));
    if (minutes < 1 ) return 'just now';
    if (minutes < 60 ) return `${minutes} min`;

    const hours = Math.floor(minutes/60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`;

    const days = Math.floor(hours/24);
    return `${days} day${days === 1 ? '': 's'}`
}

export const waitingDays = (isoDate:string, now = Date.now())=>
(now - new Date(isoDate).getTime()) / 86_400_000;