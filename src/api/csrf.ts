import api from "./axios";

let csrfToken: string | null = null;
let csrfRequest: Promise<string> | null = null;

export async function getCsrfToken(): Promise<string> {
    if (csrfToken){
        return csrfToken;
    }

    if (!csrfRequest){
        csrfRequest = api.get<{csrfToken: string}>('/auth/csrf/')
        .then((response) => {
            csrfToken = response.data.csrfToken;
            return csrfToken;
        })
        .finally(()=>{
            csrfRequest = null;
        });
    }

    return csrfRequest;
}

export async function getCsrfHeaders(): Promise<Record<string, string>> {
    const token = await getCsrfToken();

    return{
        'X-CSRFToken': token,
    }
}

export function clearCsrfToken(): void{
    csrfToken = null;
}