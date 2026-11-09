import type { Category } from "../../types/Category";

const pluralise = (count:number,singular:string,plural:string)=> `${count} ${count === 1 ? singular : plural}`

export function formatCategoryUsage(category:Category): string{
    const parts : string[] = [];

    if (category.blog_count > 0){
        parts.push(pluralise(category.blog_count,'blog','blogs'))
    }

    if (category.video_count > 0){
        parts.push(pluralise(category.video_count,'video','videos'))
    }

    return parts.join(' and ')
}

export function canDeleteCategory(category:Category) : boolean{
    return category.usage_count === 0
}

export function getCategoryDeleteBlockedReason(category:Category) : string | null {
    if (canDeleteCategory(category)) return null;

    const usage = formatCategoryUsage(category) || `${category.usage_count} items`;

    return `Used by ${usage}. Reassign or remove that content first, or mark this category inactive instead `
}