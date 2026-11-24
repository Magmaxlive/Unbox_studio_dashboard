import type { BlogStatus } from '../../types/Blogs'

export type BulkMode = 'archive' | 'restore' | 'category' | 'delete';

export interface BulkNoun {
    singular : string;   // "blog"
    plural : string;     // "blogs"
}

export const BLOG_NOUN : BulkNoun = { singular : 'blog', plural : 'blogs' };
export const VIDEO_NOUN : BulkNoun = { singular : 'video', plural : 'videos' };

export interface BulkModeConfig {
    label : string;
    verb : string;
    pastTense : string;
    description : string;
    statuses : BlogStatus[];
    buttonClass : string;
    danger : boolean;
}

export const pluralise = (count:number, noun:BulkNoun) =>
    `${count} ${count === 1 ? noun.singular : noun.plural}`;

// Eligibility mirrors the backend rules for each role.
// Admins only ever see their own drafts, so 'draft' means "my drafts".
export function getBulkModeConfig(mode:BulkMode, isAdmin:boolean, noun:BulkNoun) : BulkModeConfig {
    const { plural } = noun;

    switch (mode) {
        case 'archive':
            return {
                label : 'Archive',
                verb : 'Archive',
                pastTense : 'Archived',
                description : `Select published ${plural} to archive. They will be removed from the public website.`,
                statuses : ['published'],
                buttonClass : 'bg-slate-600 hover:bg-slate-700',
                danger : true,
            };
        case 'restore':
            return {
                label : 'Restore',
                verb : 'Restore',
                pastTense : 'Restored',
                description : `Select archived ${plural} to restore to the public website.`,
                statuses : ['archived'],
                buttonClass : 'bg-teal-600 hover:bg-teal-700',
                danger : false,
            };
        case 'category':
            return {
                label : 'Change category',
                verb : 'Move',
                pastTense : 'Moved',
                description : isAdmin
                    ? `Select ${plural} to move to another category: your drafts, or any pending, published or archived ${noun.singular}.`
                    : `Select your drafts or rejected ${plural} to move to another category.`,
                statuses : isAdmin ? ['draft', 'pending', 'published', 'archived'] : ['draft', 'rejected'],
                buttonClass : 'bg-blue-600 hover:bg-blue-700',
                danger : false,
            };
        case 'delete':
            return {
                label : 'Delete',
                verb : 'Delete',
                pastTense : 'Deleted',
                description : isAdmin
                    ? `Select ${plural} to delete permanently: your drafts, or any rejected or archived ${noun.singular}. This cannot be undone.`
                    : `Select your drafts or rejected ${plural} to delete permanently. This cannot be undone.`,
                statuses : isAdmin ? ['draft', 'rejected', 'archived'] : ['draft', 'rejected'],
                buttonClass : 'bg-red-600 hover:bg-red-700',
                danger : true,
            };
    }
}

export function getAvailableBulkModes(isAdmin:boolean) : BulkMode[] {
    return isAdmin ? ['archive', 'restore', 'category', 'delete'] : ['category', 'delete'];
}