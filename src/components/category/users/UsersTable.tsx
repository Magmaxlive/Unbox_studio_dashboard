import type { User } from "../../../types/Users"
import ActionButton from "../../ui/ActionButton"
import UserRoleBadge from "./UserRoleBadge";

interface UserTableProps {
    users : User[];
    isFetching?: boolean;
    onView : (user:User) => void;
    onEdit : (user:User) => void;
    onDelete : (user:User) => void;
}

const thClass = "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
const tdClass = "px-4 py-3 align-middle"
const actionBaseClass = "rounded-lg px-3 py-1.5 text-sm font-medium transition capitalize"
const actionDisabledClass = "cursor-not-allowed bg-gray-100 text-gray-400"

const UsersTable = ({users,isFetching,onView,onEdit,onDelete}:UserTableProps) => {
  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm transition-opacity ${isFetching ? 'opacity-60':''}`}>
        <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                <th scope="col" className={`${thClass} text-left capitalize`}>name</th>
                
                <th scope="col" className={`${thClass} text-left capitalize`}>email</th>
                
                <th scope="col" className={`${thClass} text-left capitalize`}>role</th>
                <th scope="col" className={`${thClass} text-left capitalize`}>actions</th>
                </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
                {users.map((user)=>(
                    <tr key={user.id} className="transition hover:bg-gray-50">
                        {/* name */}
                        <td className={tdClass}>
                            {user.name}
                        </td>

                       

                        {/* email */}
                        <td className={tdClass}>
                            {user.email}
                        </td>

                        {/* role */}
                        <td className={`${tdClass} capitalize`}>
                            <UserRoleBadge role={user.role} />
                        </td>

                        

                        {/* actions */}
                        <td className={`${tdClass} text-right`}>
                            <div className="flex items-center justify-start gap-2">
                                <ActionButton
                                    onClick={()=>onView(user)}
                                    className={actionBaseClass}
                                    enabledClassName="bg-gray-800 text-white hover:bg-gray-900"
                                    disabledClassName={actionDisabledClass}
                                >
                                    View
                                </ActionButton>

                                <ActionButton
                                 onClick={()=>onEdit(user)}
                                //  disabledReason={getEditBlockedReason(blog,user)}
                                  className={actionBaseClass}
                                    enabledClassName="bg-blue-600 text-white hover:bg-blue-900"
                                    disabledClassName={actionDisabledClass}
                                 >
                                    edit
                                </ActionButton>

                                 <ActionButton
                                    onClick={()=>onDelete(user)}
                                    // disabledReason={getDeleteBlockedReason(blog,user)}
                                    className={actionBaseClass}
                                    enabledClassName="bg-red-600 text-white hover:bg-red-700"
                                    disabledClassName={actionDisabledClass}
                                >
                                    Delete
                                </ActionButton>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
            
        </table>
      
    </div>
  )
}

export default UsersTable
