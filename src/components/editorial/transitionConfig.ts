import type { BlogTransition } from '../../types/Blogs'
import type { BulkNoun } from '../bulk/bulkActions'

export interface TransitionConfirm {
    title : string;
    description : string;
    confirmText : string;
    variant : 'danger' | 'default';
}

export interface TransitionConfig {
    label : string;
    successMessage : string;
    className : string;
    confirm? : TransitionConfirm;
}

export type TransitionConfigMap = Record<BlogTransition, TransitionConfig>;

// Same labels, colours and confirmations for every content type; only the noun changes.
export function buildTransitionConfig(noun:BulkNoun) : TransitionConfigMap {
    const Noun = noun.singular.charAt(0).toUpperCase() + noun.singular.slice(1);

    return {
        submit : {
            label : 'Submit for review',
            successMessage : `${Noun} submitted for review`,
            className : 'bg-gray-900 text-white hover:bg-gray-700',
        },
        withdraw : {
            label : 'Withdraw',
            successMessage : `${Noun} withdrawn from review`,
            className : 'bg-gray-500 text-white hover:bg-gray-600',
        },
        publish : {
            label : 'Publish',
            successMessage : `${Noun} published`,
            className : 'bg-green-600 text-white hover:bg-green-700',
            confirm : {
                title : `publish ${noun.singular}?`,
                description : 'It will be visible on the public website.',
                confirmText : 'publish',
                variant : 'default',
            },
        },
        reject : {
            label : 'Reject',
            successMessage : `${Noun} rejected`,
            className : 'bg-red-600 text-white hover:bg-red-700',
        },
        archive : {
            label : 'Archive',
            successMessage : `${Noun} archived`,
            className : 'bg-slate-600 text-white hover:bg-slate-700',
            confirm : {
                title : `archive ${noun.singular}?`,
                description : 'It will be removed from the public website. You can restore it later.',
                confirmText : 'archive',
                variant : 'danger',
            },
        },
        restore : {
            label : 'Restore',
            successMessage : `${Noun} restored`,
            className : 'bg-teal-600 text-white hover:bg-teal-700',
        },
    };
}