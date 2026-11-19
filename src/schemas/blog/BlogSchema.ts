import z from "zod";

const coverImageSchema = z.object({
    id : z.string(),
    url : z.string().nullable(),
    thumbnail_url : z.string().nullable(),
    alt_text : z.string().max(300,'Alt text must be 300 characters or fewer.')
})

export const blogSchema = z.object({

    title : z.string()
    .trim()
    .min(1,'Title is required')
    .max(300,'Title must be 300 characters or fewer.'),
    
    category : z.string(),

    excerpt : z.string()
    .max(300,'Excerpt must be 300 characters or fewer.'),

    content : z.string()
    .trim()
    .min(1,'Content is required.'),

    cover_image : coverImageSchema.nullable(),
})

export type BlogFormValues = z.infer<typeof blogSchema>
export type CoverImageValue = z.infer<typeof coverImageSchema>