import axios from "axios";

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 403) {
      return "You don't have permission to perform this action.";
    }

    if (status === 401) {
      return "Your session has expired. Please log in again.";
    }

    if (status !== undefined && status >= 500) {
      return "Something went wrong on the server. Please try again later.";
    }

    if (data && typeof data === "object") {
      return Object.entries(data)
        .map(([field, messages]) => {
          const message = Array.isArray(messages)
            ? messages.join(", ")
            : String(messages);

          return `${field}: ${message}`;
        })
        .join("\n");
    }
  }

  return "Something went wrong. Please try again.";
};