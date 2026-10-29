import {z} from "zod";

export const loginSchema = z.object({
    email: z.email({error:'Please enter a valid email address'}),
    password: z.string().min(6,'Password must at least 6 letters')
})

export type LoginFormValues = z.infer<typeof loginSchema>