export type ContentActivityAction =
| "created" | "edited" | "submitted" | "withdrawn" | "published" | "rejected" | "archived" | "restored" | "deleted" ;

export interface ContentActivity {
    id : string;
    action : ContentActivityAction;
    action_label : string;
    actor : string | null;
    actor_name : string | null;
    from_status : string;
    to_status : string;
    note : string;
    changed_fields : string[];
    created_at : string;
}