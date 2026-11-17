import { useMutation,useQueryClient,useQuery,keepPreviousData } from "@tanstack/react-query";
import { getUsers } from "../../api/users";
import type { User,UserFilter } from "../../types/Users";

export const UserKeys = {
    all : ['users'] as const ,

    lists : ()=> [...UserKeys.all, 'list'] as const,
    list : (filters:UserFilter) => [...UserKeys.lists(),filters] as const,
}


// fetch all users
export function useUsers(filters:UserFilter = {}){
    return useQuery({
       queryKey : UserKeys.list(filters),
       queryFn : ()=> getUsers(filters),
       placeholderData : keepPreviousData,
    })
}