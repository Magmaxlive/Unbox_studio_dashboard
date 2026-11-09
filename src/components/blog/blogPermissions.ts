import type { Blog,BlogStatus } from "../../types/Blogs"
import { BLOG_STATUS_CONFIG } from "./blogStatus"

const MUTABLE_STAUSES : BlogStatus[] = ['draft','rejected']
const isMutableStatus = (blog : Blog) => MUTABLE_STAUSES.includes(blog.status);

// admin can edit any status : contributors only draft/rejected
export function canEditBlog(blog:Blog,isAdmin:boolean) : boolean {
    return isAdmin || isMutableStatus(blog)
}

// same rule for everyone : only draft/rejected
export function canDeleteBlog(blog:Blog) : boolean{
    return isMutableStatus(blog);
}

export function getEditBlockedReason(blog:Blog,isAdmin:boolean):string|null{
    return canEditBlog(blog,isAdmin) ? null : 'Only draft or rejected blogs can be edited.'
}

export function getDeleteBlockedReason(blog:Blog):string|null{
    return canDeleteBlog(blog) ? null : 'Only draft or rejected blogs can be deleted.'
}

// A short explanation for the View modal, or null when every action is allowed.
export function getBlockedActionNote(blog:Blog,isAdmin:boolean) : string | null {
    const canEdit = canEditBlog(blog,isAdmin);
    const canDelete = canDeleteBlog(blog);

    if (canEdit && canDelete) return null;

    const statusLabel = BLOG_STATUS_CONFIG[blog.status].label.toLowerCase();

    if (!canEdit && !canDelete){
        return `This blog is ${statusLabel}, so it can't be edited or deleted. Only draft or rejected blogs can be changed`;
    }

    return `This blog is ${statusLabel}, so it can't be deleted. Only draft or rejected blogs can be deleted.`;
 
}
