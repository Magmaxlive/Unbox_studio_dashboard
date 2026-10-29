import { unknown, type ZodType } from "zod";

export function zodValidator<T>(schema : ZodType<T>){
    return ({value}: {value: unknown}) => {
        const result = schema.safeParse(value);

        if (result.success){
            return undefined;
        }

        return result.error.issues[0]?.message ?? "Invalid value";
    }
}