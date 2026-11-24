import type { Blog} from '../../types/Blogs'
import { getActionNote,getAvailableTransitions as getTransitionFor, type Viewer } from '../editorial/editorialPermissions';

// blogs use shared editorial rules

export {
    getEditBlockedReason,
    getDeleteBlockedReason,
    type AvailableTransition
} from '../editorial/editorialPermissions'

// mirrors blog.get_submission_errors()
function getBlogSubmissionBlockedReason(blog:Blog) : string | null {
    if (!blog.category) return 'Choose a category before submitting.';
    if (!blog.cover_image) return 'Add a cover image before submitting.';
    return null;
}

export const getAvailableTransitions = (blog:Blog,user:Viewer) =>
    getTransitionFor(blog,user,getBlogSubmissionBlockedReason);

export const getBlogActionNote = (blog:Blog,user:Viewer) => getActionNote(blog,user)
