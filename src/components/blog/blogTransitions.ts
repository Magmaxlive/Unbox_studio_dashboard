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

export const BLOG_TRANSITION_CONFIG : Record<BlogTransition,TransitionConfig> = {
    submit:{
        label : 'Submit for review',
        successMessage : 'Blog submitted for review',
        className: 'bg-gray-900 text-white hover:bg-gray-700',
    },

    withdraw : {
        label : 'Withdraw',
        successMessage : 'Blog withdrawn from review',
        className : 'bg-green-600 text-white hover:bg-green-700',
    },

    publish : {
        label : 'Publish',
        successMessage : 'Blog published',
        className : 'bg-green-600 text-white hover:bg-green-700',
        confirm : {
            title : 'Publish blog ?',
            description : 'It will be visible on the public website.',
            confirmText : 'publish',
            variant : 'default'
        }
    },

    reject : {
        label : 'Reject',
        successMessage : 'Blog rejected',
        className : 'border border-red-200 text-red-600 hover:bg-red-600 hover:text-white',
    },

    archive : {
        label : 'Archive',
        successMessage : 'Blog archived',
        className : 'border border-gray-200 bg-gray-700 text-white hover:bg-black',
        confirm : {
            title : 'Archive blog?',
            description : 'It will be removed from the public website. You can restore it later.',
            confirmText : 'archive',
            variant : 'danger',
        },
    },

    restore : {
        label : 'Restore',
        successMessage : 'Blog restored',
        className : 'border border-gray-200 text-white bg-cyan-600 hover:bg-cyan-800',
    },
}