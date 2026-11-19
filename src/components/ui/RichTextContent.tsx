import { useMemo } from 'react'
import DOMPurify from 'dompurify'

// Same allowlist as the backend (RICH_TEXT_TAGS / RICH_TEXT_ATTRIBUTES in
// apps/core/sanitize.py) plus rel, which the backend adds to every link.
// Content is already cleaned on save; this is a second layer for older rows
// and anything written outside the API.
const ALLOWED_TAGS = ['p', 'br', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote', 'a'];
const ALLOWED_ATTR = ['href', 'title', 'target', 'rel'];

// Older content may be plain text (no tags), e.g. saved before the editor existed
const looksLikeHtml = (value:string) => /<\/?[a-z][\s\S]*>/i.test(value);

interface RichTextContentProps {
    html : string;
    className? : string;
}

const RichTextContent = ({ html, className = '' }:RichTextContentProps) => {
    const isHtml = looksLikeHtml(html);

    // Hooks must run unconditionally, so clean before any early return.
    const cleanHtml = useMemo(
        ()=> isHtml ? DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR }) : '',
        [html, isHtml]
    );

    if (!html.trim()) {
        return <p className="text-sm text-gray-500">No content.</p>
    }

    if (!isHtml) {
        // plain text: keep line breaks
        return <div className={`rich-text whitespace-pre-wrap ${className}`}>{html}</div>
    }

    return (
        <div
            className={`rich-text ${className}`}
            dangerouslySetInnerHTML={{ __html : cleanHtml }}
        />
    )
}

export default RichTextContent