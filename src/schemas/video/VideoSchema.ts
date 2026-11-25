import z from "zod";
import type { CoverImageValue } from "../blog/BlogSchema";

export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 5000;

// draft level rules only
export const videoSchema = z.object({
    title : z.string().trim().min(1,'Title is required').max(TITLE_MAX,`Title must be ${TITLE_MAX} characters or fewer.`),
    description : z.string().max(DESCRIPTION_MAX,`Description must be ${DESCRIPTION_MAX} characters or fewer.`),
    category : z.string(),
    thumbnail : z.custom<CoverImageValue | null >(),
    source_type : z.enum(['upload','embed']),
    source_url : z.string().max(1000, 'Link is too long.')
});

export type VideoFormValues = z.infer<typeof videoSchema>;