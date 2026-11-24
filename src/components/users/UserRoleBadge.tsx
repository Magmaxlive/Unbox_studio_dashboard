import { USER_ROLE_CONFIG } from "./userRole";
import type { UserRole } from "../../types/Users";

interface UserRoleBadgeProps{
    role : UserRole;
}

const UserRoleBadge = ({role}:UserRoleBadgeProps) => {
    const config = USER_ROLE_CONFIG[role]
    return(
        <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-medium ${config.className}`}>
            {config.label}
        </span>
    )
}

export default UserRoleBadge