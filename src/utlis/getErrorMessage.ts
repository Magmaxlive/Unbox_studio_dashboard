// Converts a TanStack Form field error (typed as unknown) into a display string.
// Zod validators produce issue objects with a `message`; custom validators may return strings.
export function getErrorMessage(error: unknown): string {
    if (typeof error === 'string') return error;

    if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
    ) {
        return error.message;
    }

    return 'Invalid value';
}