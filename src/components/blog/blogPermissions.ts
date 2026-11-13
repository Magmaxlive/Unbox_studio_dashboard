import type { Blog, BlogStatus, BlogTransition } from '../../types/Blogs'
import type { AuthUser } from '../../api/auth'

// Mirrors apps/moderation/rules.py. Messages are identical to the backend's,
// so a greyed button's tooltip matches the 403 the API would return.
// The backend is the real enforcement; this only decides what the UI offers.
// When a rule changes, update rules.py and this file together.

type Viewer = Pick<AuthUser, 'id' | 'role'> | null;

const isAdmin = (user:Viewer) => user?.role === 'admin';
const isAuthor = (blog:Blog, user:Viewer) => Boolean(user) && blog.contributor === user?.id;
const isOneOf = (status:BlogStatus, statuses:BlogStatus[]) => statuses.includes(status);

// Mirrors get_edit_denial()
export function getEditBlockedReason(blog:Blog, user:Viewer) : string | null {
    const { status } = blog;

    if (isAuthor(blog, user)) {
        if (isAdmin(user) || isOneOf(status, ['draft', 'rejected'])) return null;

        if (status === 'pending') {
            return 'This content is pending review. Withdraw it from review before editing.';
        }

        return 'Published or archived content can only be changed by an admin. Contact an admin if changes are needed.';
    }

    if (!isAdmin(user)) return 'You do not have permission to edit this content.';

    // admin editing someone else's content
    if (isOneOf(status, ['pending', 'published', 'archived'])) return null;

    if (status === 'rejected') return 'Rejected content is back with its author for changes.';

    return 'Drafts can only be edited by their author.';
}

// Mirrors get_delete_denial()
export function getDeleteBlockedReason(blog:Blog, user:Viewer) : string | null {
    const { status } = blog;

    if (isAuthor(blog, user)) {
        const allowed : BlogStatus[] = isAdmin(user)
            ? ['draft', 'rejected', 'archived']
            : ['draft', 'rejected'];

        if (isOneOf(status, allowed)) return null;

        if (status === 'pending') {
            return 'This content is pending review. Withdraw it from review before deleting.';
        }

        if (status === 'published' && isAdmin(user)) {
            return 'Published content must be archived before it can be deleted.';
        }

        return 'Published or archived content can only be removed by an admin. Contact an admin if needed.';
    }

    if (!isAdmin(user)) return 'You do not have permission to delete this content.';

    // admin deleting someone else's content
    if (isOneOf(status, ['rejected', 'archived'])) return null;

    if (status === 'published') return 'Published content must be archived before it can be deleted.';

    if (status === 'pending') {
        return 'Pending content cannot be deleted. Reject it instead if it should not be published.';
    }

    return 'Drafts can only be deleted by their author.';
}

// Mirrors get_transition_denial() (role + status rules only)
function getTransitionRuleDenial(blog:Blog, user:Viewer, transition:BlogTransition) : string | null {
    const { status } = blog;
    const author = isAuthor(blog, user);
    const admin = isAdmin(user);

    switch (transition) {
        case 'submit':
            if (!author) return 'Only the author can submit this content for review.';
            if (!isOneOf(status, ['draft', 'rejected'])) return 'Only draft or rejected content can be submitted for review.';
            return null;

        case 'withdraw':
            if (!author) return 'Only the author can withdraw this content from review.';
            if (status !== 'pending') return 'Only content pending review can be withdrawn.';
            return null;

        case 'publish': {
            if (!admin) return 'Only admins can publish content.';
            const allowed : BlogStatus[] = author ? ['draft', 'pending'] : ['pending'];
            if (isOneOf(status, allowed)) return null;
            if (status === 'rejected') return 'Rejected content must be resubmitted by its author before it can be published.';
            if (status === 'archived') return 'Archived content must be restored, not published.';
            if (status === 'published') return 'This content is already published.';
            return 'Drafts must be submitted by their author before they can be published.';
        }

        case 'reject':
            if (!admin) return 'Only admins can reject content.';
            if (status !== 'pending') return 'Only content pending review can be rejected.';
            return null;

        case 'archive':
            if (!admin) return 'Only admins can archive content.';
            if (status !== 'published') return 'Only published content can be archived.';
            return null;

        case 'restore':
            if (!admin) return 'Only admins can restore content.';
            if (status !== 'archived') return 'Only archived content can be restored.';
            return null;
    }
}

// Mirrors Blog.get_submission_errors(). Content is always non-empty once
// saved (the serializer rejects empty content), so only category is checked.
function getSubmissionBlockedReason(blog:Blog) : string | null {
    if (!blog.category) return 'Choose a category before submitting.';
    return null;
}

export interface AvailableTransition {
    transition : BlogTransition;
    // set when the action applies but the blog isn't complete yet
    disabledReason : string | null;
}

const TRANSITION_ORDER : BlogTransition[] = ['submit', 'withdraw', 'publish', 'reject', 'archive', 'restore'];

// Status actions this user can take on this blog right now.
// Actions that don't apply (wrong role or status) are omitted entirely;
// submit/publish are included but disabled when the blog is incomplete.
export function getAvailableTransitions(blog:Blog, user:Viewer) : AvailableTransition[] {
    return TRANSITION_ORDER
        .filter((transition)=>getTransitionRuleDenial(blog, user, transition) === null)
        .map((transition)=>({
            transition,
            disabledReason : transition === 'submit' || transition === 'publish'
                ? getSubmissionBlockedReason(blog)
                : null,
        }));
}

// One short explanation for the View modal, or null when edit and delete are both allowed.
export function getBlogActionNote(blog:Blog, user:Viewer) : string | null {
    const editReason = getEditBlockedReason(blog, user);
    const deleteReason = getDeleteBlockedReason(blog, user);

    if (!editReason && !deleteReason) return null;

    if (editReason && deleteReason) {
        if (blog.status === 'pending' && isAuthor(blog, user)) {
            return 'This content is pending review. Withdraw it from review to edit or delete it.';
        }
        return editReason;
    }

    return editReason ?? deleteReason;
}