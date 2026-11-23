export interface Category{
    id : string;
    name : string;
    slug : string;
    color_name : string;
    color_hex : string;
    text_color_hex : string;
    created_by : string;
    created_by_name : string;
    created_at : string;
    updated_at : string;
    description : string;
    is_active : boolean; 
    blog_count : number;
    video_count : number;
    usage_count : number
}

export interface CategoryPayload{
    name : string;
    description : string;
    color_name : string;
    color_hex : string;
    text_color_hex : string;
    is_active : boolean;
    slug? : string;
}

export interface CategoryFilter{
    is_active? : boolean;
    page? : number
}

export interface MoveContentPayload{
    target_category : string;
    deactivate_source : boolean;
}

export interface MoveContentPayload{
    moved : { blogs : number ; videos : number };
    drafts_left : { blogs : number ; videos : number };
    deactivated : boolean;
}