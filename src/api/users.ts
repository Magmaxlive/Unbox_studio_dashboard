import api from "./axios";
import type { User } from "../types/Users";
import type { UserFilter } from "../types/Users";
import type { PaginatedResponse } from "../types/PaginatedResponse";

// user fetching
export async function getUsers(filters : UserFilter = {}) : Promise<PaginatedResponse<User>>{
    const response = await api.get<PaginatedResponse<User>>('/auth/users/',{params : filters});
    return response.data;
}