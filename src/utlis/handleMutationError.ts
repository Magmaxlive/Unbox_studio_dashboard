import axios from "axios";
import { toast } from "sonner";

interface MutationErrorHandlers {
  setFieldErrors?: (errors: Record<string, string>) => void;
}

// Keys DRF uses for errors that don't belong to a specific field.
const NON_FIELD_KEYS = ["detail", "non_field_errors"];

// Reads DRF's `detail` message, which may be a string or a list of strings.
const getDetailMessage = (data: unknown): string | null => {
  if (!data || typeof data !== "object" || !("detail" in data)) return null;

  const detail = (data as { detail: unknown }).detail;

  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) return detail.map(String).join(", ");

  return null;
};

export const handleMutationError = (
  error: unknown,
  handlers?: MutationErrorHandlers
) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    // Validation / business-rule errors
    if (status === 400 && data && typeof data === "object") {
      const errors: Record<string, string> = {};

      Object.entries(data).forEach(([field, messages]) => {
        errors[field] = Array.isArray(messages)
          ? messages.map(String).join(", ")
          : String(messages);
      });

      // Split general messages from field-level messages
      const generalMessage = NON_FIELD_KEYS
        .map((key) => errors[key])
        .find(Boolean);

      const fieldErrors = Object.fromEntries(
        Object.entries(errors).filter(([field]) => !NON_FIELD_KEYS.includes(field))
      );

      const hasFieldErrors = Object.keys(fieldErrors).length > 0;

      // Form context: show field errors inline
      if (hasFieldErrors && handlers?.setFieldErrors) {
        handlers.setFieldErrors(fieldErrors);
        toast.error(generalMessage ?? "Please check the form for validation errors.");
        return;
      }

      // General message (e.g. "Cannot delete this category...")
      if (generalMessage) {
        toast.error(generalMessage);
        return;
      }

      // Field errors but no form to display them: show the first one
      if (hasFieldErrors) {
        toast.error(Object.values(fieldErrors)[0]);
        return;
      }

      toast.error("The request could not be processed.");
      return;
    }

    if (status === 401) {
      toast.error("Your session has expired. Please log in again.");
      return;
    }

    // Permission errors: prefer the backend's reason
    // (e.g. "Only draft or rejected content can be deleted.")
    if (status === 403) {
      toast.error(
        getDetailMessage(data) ?? "You don't have permission to perform this action."
      );
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