import axios from "axios";
import { toast } from "sonner";

interface MutationErrorHandlers {
  setFieldErrors?: (errors: Record<string, string>) => void;
}

export const handleMutationError = (
  error: unknown,
  handlers?: MutationErrorHandlers
) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    // Validation errors
    if (status === 400 && data && typeof data === "object") {
      const errors: Record<string, string> = {};

      Object.entries(data).forEach(([field, messages]) => {
        errors[field] = Array.isArray(messages)
          ? messages.map(String).join(", ")
          : String(messages);
      });

      handlers?.setFieldErrors?.(errors);

      // Show general validation message if needed
      toast.error("Please check the form for validation errors.");

      return;
    }

    if (status === 401) {
      toast.error("Your session has expired. Please log in again.");
      return;
    }

    if (status === 403) {
      toast.error("You don't have permission to perform this action.");
      return;
    }

    if (status === 404) {
      toast.error("The requested resource could not be found.");
      return;
    }

    if (status !== undefined && status >= 500) {
      toast.error("Server error. Please try again later.");
      return;
    }

    if (!error.response) {
      toast.error("Unable to connect. Please check your internet connection.");
      return;
    }
  }

  toast.error("Something went wrong. Please try again.");
};