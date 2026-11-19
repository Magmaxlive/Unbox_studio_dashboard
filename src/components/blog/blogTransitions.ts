import type { BlogTransition } from "../../types/Blogs";

interface TransitionConfirm{
    title : string;
    description : string;
    confirmText : string;
    variant : 'danger' | 'default';
}

interface TransitionConfig{
    label : string;
    successMessage : string;
    className : string;
    confirm? : TransitionConfirm;
}

export const BLOG_TRANSITION_CONFIG : Record<BlogTransition, TransitionConfig> = {
    submit : {
        label : 'Submit for review',
        successMessage : 'Blog submitted for review',
        className : 'bg-gray-900 text-white hover:bg-gray-700',
    },
    withdraw : {
        label : 'Withdraw',
        successMessage : 'Blog withdrawn from review',
        className : 'bg-gray-500 text-white hover:bg-gray-600',
    },
    publish : {
        label : 'Publish',
        successMessage : 'Blog published',
        className : 'bg-green-600 text-white hover:bg-green-700',
        confirm : {
            title : 'publish blog?',
            description : 'It will be visible on the public website.',
            confirmText : 'publish',
            variant : 'default',
        },
    },
    reject : {
        label : 'Reject',
        successMessage : 'Blog rejected',
        className : 'bg-red-600 text-white hover:bg-red-700',
    },
    archive : {
        label : 'Archive',
        successMessage : 'Blog archived',
        className : 'bg-slate-600 text-white hover:bg-slate-700',
        confirm : {
            title : 'archive blog?',
            description : 'It will be removed from the public website. You can restore it later.',
            confirmText : 'archive',
            variant : 'danger',
        },
    },
    restore : {
        label : 'Restore',
        successMessage : 'Blog restored',
        className : 'bg-teal-600 text-white hover:bg-teal-700',
    },
};