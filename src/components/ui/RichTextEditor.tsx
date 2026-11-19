import { useEffect } from 'react'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
    Bold,
    Italic,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Link as LinkIcon,
    Undo2,
    Redo2,
} from 'lucide-react'

// The editor may only produce what the backend keeps.
// Keep in sync with RICH_TEXT_TAGS in apps/core/sanitize.py:
// p, br, h2, h3, strong, em, ul, ol, li, blockquote, a
const extensions = [
    StarterKit.configure({
        heading : { levels : [2, 3] },
        // not in the backend allowlist: switched off so they can't be
        // created (or kept when pasting)
        code : false,
        codeBlock : false,
        horizontalRule : false,
        strike : false,
        underline : false,
        link : {
            openOnClick : false,
            autolink : true,
            defaultProtocol : 'https',
            // match what the backend stores, to avoid needless differences
            HTMLAttributes : {
                rel : 'noopener noreferrer',
                target : '_blank',
            },
        },
    }),
];

// ── toolbar ──

interface ToolbarButtonProps {
    label : string;
    isActive? : boolean;
    disabled? : boolean;
    onClick : () => void;
    children : React.ReactNode;
}

const ToolbarButton = ({label, isActive=false, disabled=false, onClick, children}:ToolbarButtonProps) => (
    <button
        type="button"
        title={label}
        aria-label={label}
        aria-pressed={isActive}
        disabled={disabled}
        // keep the editor's selection when clicking toolbar buttons
        onMouseDown={(e)=>e.preventDefault()}
        onClick={onClick}
        className={`flex size-8 cursor-pointer items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-30 ${
            isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
        {children}
    </button>
)

const Divider = () => <span className="mx-1 h-5 w-px bg-gray-200" aria-hidden="true" />

const Toolbar = ({ editor }:{ editor:Editor }) => {
    // re-renders the toolbar only when these values change
    const state = useEditorState({
        editor,
        selector : ({ editor }) => ({
            isBold : editor.isActive('bold'),
            isItalic : editor.isActive('italic'),
            isH2 : editor.isActive('heading', { level : 2 }),
            isH3 : editor.isActive('heading', { level : 3 }),
            isBulletList : editor.isActive('bulletList'),
            isOrderedList : editor.isActive('orderedList'),
            isQuote : editor.isActive('blockquote'),
            isLink : editor.isActive('link'),
            canUndo : editor.can().undo(),
            canRedo : editor.can().redo(),
        }),
    });

    const handleLink = () => {
        const previous = editor.getAttributes('link').href ?? '';
        const input = window.prompt('Link URL (leave empty to remove the link)', previous);

        if (input === null) return; // cancelled

        const url = input.trim();
        if (!url) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // only http(s) and mailto are allowed; anything else gets https://
        const href = /^(https?:|mailto:)/i.test(url) ? url : `https://${url}`;
        editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }

    return (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5" role="toolbar" aria-label="Formatting">
            <ToolbarButton label="Heading 2" isActive={state.isH2} onClick={()=>editor.chain().focus().toggleHeading({ level : 2 }).run()}>
                <Heading2 size={16} />
            </ToolbarButton>
            <ToolbarButton label="Heading 3" isActive={state.isH3} onClick={()=>editor.chain().focus().toggleHeading({ level : 3 }).run()}>
                <Heading3 size={16} />
            </ToolbarButton>

            <Divider />

            <ToolbarButton label="Bold" isActive={state.isBold} onClick={()=>editor.chain().focus().toggleBold().run()}>
                <Bold size={16} />
            </ToolbarButton>
            <ToolbarButton label="Italic" isActive={state.isItalic} onClick={()=>editor.chain().focus().toggleItalic().run()}>
                <Italic size={16} />
            </ToolbarButton>

            <Divider />

            <ToolbarButton label="Bullet list" isActive={state.isBulletList} onClick={()=>editor.chain().focus().toggleBulletList().run()}>
                <List size={16} />
            </ToolbarButton>
            <ToolbarButton label="Numbered list" isActive={state.isOrderedList} onClick={()=>editor.chain().focus().toggleOrderedList().run()}>
                <ListOrdered size={16} />
            </ToolbarButton>
            <ToolbarButton label="Quote" isActive={state.isQuote} onClick={()=>editor.chain().focus().toggleBlockquote().run()}>
                <Quote size={16} />
            </ToolbarButton>

            <Divider />

            <ToolbarButton label={state.isLink ? 'Edit link' : 'Add link'} isActive={state.isLink} onClick={handleLink}>
                <LinkIcon size={16} />
            </ToolbarButton>

            <Divider />

            <ToolbarButton label="Undo" disabled={!state.canUndo} onClick={()=>editor.chain().focus().undo().run()}>
                <Undo2 size={16} />
            </ToolbarButton>
            <ToolbarButton label="Redo" disabled={!state.canRedo} onClick={()=>editor.chain().focus().redo().run()}>
                <Redo2 size={16} />
            </ToolbarButton>
        </div>
    )
}

// ── editor ──

interface RichTextEditorProps {
    value : string;
    onChange : (html:string) => void;
    onBlur? : () => void;
    invalid? : boolean;
    // id of the visible label element, for screen readers
    labelledBy? : string;
}

const RichTextEditor = ({value, onChange, onBlur, invalid=false, labelledBy}:RichTextEditorProps) => {
    const editor = useEditor({
        extensions,
        content : value,
        editorProps : {
            attributes : {
                class : 'rich-text min-h-[320px] px-4 py-3 text-sm outline-none',
                ...(labelledBy ? { 'aria-labelledby' : labelledBy } : {}),
            },
        },
        // an empty editor still contains <p></p>; report '' so
        // "Content is required" and unsaved-changes checks behave correctly
        onUpdate : ({ editor }) => {
            onChange(editor.isEmpty ? '' : editor.getHTML());
        },
        onBlur : () => {
            onBlur?.();
        },
    });

    // Follow changes made from outside (e.g. form.reset() after save with the
    // server's cleaned HTML) without reporting them back as user edits.
    useEffect(()=>{
        if (!editor) return;

        const current = editor.isEmpty ? '' : editor.getHTML();
        if (value !== current) {
            editor.commands.setContent(value || '', { emitUpdate : false });
        }
    },[editor, value])

    if (!editor) return null;

    return (
        <div
            className={`overflow-hidden rounded-lg border bg-white transition focus-within:border-gray-900 ${
                invalid ? 'border-red-300' : 'border-gray-200'
            }`}
        >
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    )
}

export default RichTextEditor