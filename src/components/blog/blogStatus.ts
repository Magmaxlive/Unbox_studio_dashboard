import type { BlogStatus } from "../../types/Blogs";

interface BlogStatusConfig {
    label : string;
    className : string;
}

export const BLOG_STATUS_CONFIG : Record<BlogStatus,BlogStatusConfig> = {
    draft : {
        label : 'Draft',
        className : 'bg-gray-100 text-gray-700'
    },

    pending : {
        label : 'Pending Review',
        className : 'bg-amber-50 text-amber-700'
    },

    published : {
        label : 'Published',
        className : 'bg-green-50 text-green-700'
    },

    rejected : {
        label : 'Rejected',
        className : 'bg-red-50 text-red-700'
    },

    archived : {
        label : 'Archieved',
        className : 'bg-slate-100 text-slate-500'
    }
}

export const BLOG_STATUS_OPTIONS = (Object.keys(BLOG_STATUS_CONFIG) as BlogStatus[]).map(
    (status)=>({
        value : status,
        label : BLOG_STATUS_CONFIG[status].label
    })
)