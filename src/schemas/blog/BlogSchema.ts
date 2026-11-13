import z from "zod";

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
    .min(1,'Content is required.')
})

export type BlogFormValues = z.infer<typeof blogSchema>