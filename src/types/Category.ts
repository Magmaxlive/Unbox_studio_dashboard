export interface Category{
    id : string;
    name : string;
    slug : string;
    color_name : string;
    color_hex : string;
    text_color_hex : string;
    created_by : string;
    created_at : string;
    updated_at : string;
    description : string;
    is_active : boolean; 
}

export interface CategoryPayload{
    name : string;
    description : string;
    color_name : string;
    color_hex : string;
    text_color_hex : string;
    is_active : boolean;
}