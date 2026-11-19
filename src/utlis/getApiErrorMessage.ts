import axios from "axios";

// Turns an API error into one readable sentence (for inline messages,
// where a toast from handleMutationError isn't the right fit).
export function getApiErrorMessage(error:unknown, fallback = 'Something went wrong. Please try again.') : string {
    if (axios.isAxiosError(error)) {
        if (!error.response) {
            return 'Unable to connect. Please check your internet connection.';
        }

        const data = error.response.data;
        if (data && typeof data === 'object') {
            const record = data as Record<string, unknown>;

            if (typeof record.detail === 'string') return record.detail;

            // first field error, e.g. {"mime_type": ["Unsupported image type..."]}
            const first = Object.values(record)[0];
            if (Array.isArray(first) && first.length) return String(first[0]);
            if (typeof first === 'string') return first;
        }
    }

    return fallback;
}