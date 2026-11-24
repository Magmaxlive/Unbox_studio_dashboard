import { AlertTriangle, ExternalLink, Film, Loader2 } from 'lucide-react'
import type { Video } from '../../types/Videos'
import { PROVIDER_LABELS } from '../../types/Videos'

// Placeholder box for states with nothing to play yet.
const Placeholder = ({ icon, title, text, tone = 'gray' }:{
    icon : React.ReactNode; title : string; text? : string; tone? : 'gray' | 'red' | 'amber';
}) => {
    const tones = {
        gray : 'bg-gray-50 text-gray-500',
        red : 'bg-red-50 text-red-700',
        amber : 'bg-amber-50 text-amber-700',
    };
    return (
        <div className={`flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl px-6 text-center ${tones[tone]}`}>
            {icon}
            <p className="text-sm font-medium">{title}</p>
            {text && <p className="max-w-sm text-xs leading-5 opacity-80">{text}</p>}
        </div>
    )
}

// Frame size per platform: Instagram's embed includes a header and footer,
// TikTok is vertical, YouTube and Vimeo are 16:9.
const EMBED_FRAME : Record<string, string> = {
    instagram : 'h-[720px] w-full max-w-[400px]',
    tiktok : 'aspect-[9/16] w-full max-w-[340px]',
    youtube : 'aspect-video w-full',
    vimeo : 'aspect-video w-full',
};

const VideoPlayer = ({ video }:{ video:Video }) => {
    // ── uploads ──
    if (video.source_type === 'upload') {
        const media = video.media;

        if (!media) {
            return <Placeholder icon={<Film size={28} />} title="No video uploaded yet" />
        }

        if (media.status === 'failed') {
            return (
                <Placeholder
                    tone="red"
                    icon={<AlertTriangle size={28} />}
                    title="The video upload failed"
                    text={media.failure_reason || 'Please upload the video again.'}
                />
            )
        }

        if (media.status !== 'ready' || !media.mp4_url) {
            return (
                <Placeholder
                    tone="amber"
                    icon={<Loader2 size={28} className="animate-spin" />}
                    title="Processing the video…"
                    text="This usually takes under a minute. This view updates on its own."
                />
            )
        }

        const isVertical = (media.height ?? 0) > (media.width ?? 0);

        return (
            <div className="flex justify-center rounded-xl bg-black">
                <video
                    key={media.mp4_url}
                    src={media.mp4_url}
                    poster={media.poster_url ?? undefined}
                    controls
                    playsInline
                    preload="metadata"
                    className={`rounded-xl ${isVertical ? 'max-h-[70vh] w-auto' : 'aspect-video w-full'}`}
                />
            </div>
        )
    }

    // ── embeds ──
    if (!video.player_url || !video.provider) {
        return <Placeholder icon={<Film size={28} />} title="No video link yet" />
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <iframe
                src={video.player_url}
                title={video.title}
                className={`rounded-xl border-0 bg-black ${EMBED_FRAME[video.provider] ?? 'aspect-video w-full'}`}
                // YouTube requires the referrer (Error 153 without it)
                referrerPolicy="strict-origin-when-cross-origin"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                loading="lazy"
                scrolling="no"
            />
            {video.source_url && (
                <a
                    href={video.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900"
                >
                    Open on {PROVIDER_LABELS[video.provider]} <ExternalLink size={12} />
                </a>
            )}
        </div>
    )
}

export default VideoPlayer