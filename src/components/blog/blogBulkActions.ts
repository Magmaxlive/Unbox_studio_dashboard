import type { BlogStatus } from "../../types/Blogs";

export type BlogBulkMode = 'archive' | 'restore' | 'delete' | 'category' ;

export interface BulkModeConfig{
    label : string;          // menu + banner
    verb : string;           // action button: "Archive 8 blogs"
    pastTense : string;      // summary: "Archived 8 blogs"
    description : string;    // banner explanation
    statuses : BlogStatus[]; // eligible statuses (listed via ?status_in=)
    buttonClass : string;    // solid button colour
    danger : boolean;        // red confirmation (and typed count for delete)
}

// admin only ever see their own drafts, so 'draft' means 'my drafts'

export function getBulkModeConfig(mode:BlogBulkMode,isAdmin:boolean) : BulkModeConfig {
    switch (mode){
        case 'archive':
            return {
                label : 'Archive',
                verb : 'Archive',
                pastTense : 'Archived',
                description : 'Select published blogs to archive . They will be removed from the public website .',
                statuses : ['published'],
                buttonClass : 'bg-slate-600 hover:bg-slate-700',
                danger : true
            };

        case 'restore':
            return {
                label : 'Restore',
                verb : 'Restore',
                pastTense : 'Restored',
                description : 'Select archived blogs to restore to the public website .',
                statuses : ['archived'],
                buttonClass : 'bg-teal-600 hover:bg-teal-700',
                danger : false
            };

        case 'category':
            return {
                label : 'Change category',
                verb : 'Move',
                pastTense : 'Moved',
                description : isAdmin
                    ? 'Select blogs to move to another category: your drafts, or any pending, published or archived blog.'
                    : 'Select your drafts or rejected blogs to move to another category.',
                statuses : isAdmin ? ['draft','pending','published','archived'] : ['draft','rejected'] ,
                buttonClass : 'bg-blue-600 hover:bg-blue-700',
                danger : false
            };

        case 'delete':
            return {
                label : 'Delete',
                verb : 'Delete',
                pastTense : 'Deleted',
                description : isAdmin
                    ? 'Select blogs to delete permanently: your drafts, or any rejected or archived blog. This cannot be undone.'
                    : 'Select your drafts or rejected blogs to delete permanently. This cannot be undone.',
                statuses : isAdmin ? ['draft','rejected','archived'] : ['draft','rejected'] ,
                buttonClass : 'bg-red-600 hover:bg-red-700',
                danger : true
            };
    }
}

export function getAvailableBulkModes(isAdmin:boolean) : BlogBulkMode[] {
    return isAdmin ? ['archive','category','delete','restore'] : ['category','delete'];
}

export const pluraliseBlogs = (count:number) => `${count} blog${count === 1} ? '' : 's'`