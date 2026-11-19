import type { UserRole } from "../../../types/Users";

interface UserRoleConfig{
    label : string;
    className : string;
}

export const USER_ROLE_CONFIG : Record<UserRole,UserRoleConfig> = {
    admin : {
        label : 'Admin',
        className : 'bg-green-50 text-green-700'
    },
    contributor : {
        label : 'Contributor',
        className : 'bg-gray-100 text-gray-700'
    },
}

export const USER_ROLE_OPTIONS = (Object.keys(USER_ROLE_CONFIG) as UserRole[]).map(
    (role)=>({
        value : role,
        label : USER_ROLE_CONFIG[role].label
    })
)