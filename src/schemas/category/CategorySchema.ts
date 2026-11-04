import z from "zod";

export const categorySchema = z.object({
    name : z.string().trim().min(1,'Category name is required'),
    description : z.string().trim(),
    color_name : z.string().trim().min(1,'Color name is required'),
    color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Enter a valid hex color"),
    text_color_hex : z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Enter a valid hex color"),
    is_active : z.boolean()
})