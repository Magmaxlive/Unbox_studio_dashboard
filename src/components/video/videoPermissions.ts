import type { Video } from "../../types/Videos";
import { getActionNote,getAvailableTransitions as getTransitionFor , type Viewer } from "../editorial/editorialPermissions";

export {getEditBlockedReason,getDeleteBlockedReason} from '../editorial/editorialPermissions'

// Mirrors Video.get_submission_errors()
function getVideoSubmissionBlockedReason(video:Video) : string | null{
    if (!video.category) return 'Choose a category before submitting.';
    if (!video.thumbnail) return 'Add a thumbnail before submitting.';
    if (!video.description.trim()) return 'Add a description before submitting.';

    if (video.source_type === 'upload'){
        const media = video.media;
        if (!media) return 'Upload a video before submitting.';
        if (media.status === 'failed') return 'The video upload failed . Please upload it again .';
        if (media.status != 'ready') return 'The video is still processing. Please try again in a moment.';
    } else if (!(video.provider && video.external_id)){
        return 'Add a valid video link before submitting.'
    }

    return null ;
}

export const getAvailableTransitions = (video:Video, user:Viewer) =>
    getTransitionFor(video,user,getVideoSubmissionBlockedReason);

export const getVideoActionNote = (video:Video,user:Viewer) => getActionNote(video,user);