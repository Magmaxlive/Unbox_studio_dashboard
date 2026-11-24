import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Modal from '../ui/Modal'
import type { Category } from '../../types/Category'
import { useCategoryOptions, useMoveCategoryContent } from '../../hooks/queries/categories'
import { handleMutationError } from '../../utlis/handleMutationError'
import { formatCategoryUsage } from './categoryUsage'

interface MoveContentDialogProps {
    category : Category | null;
    onClose : () => void;
}

const plural = (count:number, word:string) => `${count} ${word}${count === 1 ? '' : 's'}`;

const MoveContentDialog = ({ category, onClose }:MoveContentDialogProps) => {
    const { data:options = [] } = useCategoryOptions();
    const mutation = useMoveCategoryContent();

    const [targetId,setTargetId] = useState('');
    const [deactivate,setDeactivate] = useState(true);

    // fresh state each time the dialog opens for a category
    useEffect(()=>{
        if (category) {
            setTargetId('');
            setDeactivate(true);
        }
    },[category])

    if (!category) return null;

    // only active categories, and never the source itself
    const targets = options.filter((c)=>c.is_active && c.id !== category.id);
    const targetName = targets.find((c)=>c.id === targetId)?.name ?? '';

    const handleClose = () => {
        if (mutation.isPending) return;
        onClose();
    }

    const handleMove = () => {
        mutation.mutate(
            { id : category.id, data : { target_category : targetId, deactivate_source : deactivate } },
            {
                onSuccess : (result)=>{
                    const movedParts = [];
                    if (result.moved.blogs) movedParts.push(plural(result.moved.blogs, 'blog'));
                    if (result.moved.videos) movedParts.push(plural(result.moved.videos, 'video'));

                    const draftsLeft = result.drafts_left.blogs + result.drafts_left.videos;
                    const notes = [];
                    if (draftsLeft) notes.push(`${plural(draftsLeft, 'draft')} still use "${category.name}". Their authors can change them.`);
                    if (result.deactivated) notes.push(`"${category.name}" is now inactive.`);

                    toast.success(
                        movedParts.length
                            ? `Moved ${movedParts.join(' and ')} to ${targetName}.`
                            : `Nothing was moved: only drafts use "${category.name}".`,
                        notes.length ? { description : notes.join(' ') } : undefined,
                    );
                    onClose();
                },
                onError : (error)=>{
                    handleMutationError(error);
                },
            }
        );
    }

    const usage = formatCategoryUsage(category);

  return (
    <Modal
        isOpen
        onClose={handleClose}
        title="Move content"
        description={`Move all blogs and videos from "${category.name}" to another category.`}
    >
        <div className="space-y-5">
            <p className="text-sm text-gray-600">
                {usage ? <>Currently used by <span className="font-medium text-gray-900">{usage}</span>.</> : 'Not used yet.'}
                {' '}Drafts stay with their authors and are not moved.
            </p>

            <div>
                <label htmlFor="move-target" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Move to
                </label>
                <select
                    id="move-target"
                    value={targetId}
                    onChange={(e)=>setTargetId(e.target.value)}
                    className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm capitalize outline-none focus:border-gray-900"
                >
                    <option value="">Choose a category…</option>
                    {targets.map((c)=>(
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-3">
                <input
                    type="checkbox"
                    checked={deactivate}
                    onChange={(e)=>setDeactivate(e.target.checked)}
                    className="mt-0.5 size-4 accent-gray-900"
                />
                <span>
                    <span className="block text-sm font-medium text-gray-800">
                        Deactivate "{category.name}" after moving
                    </span>
                    <span className="block text-xs text-gray-500">
                        It will no longer be offered for new content.
                    </span>
                </span>
            </label>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                    type="button"
                    onClick={handleClose}
                    disabled={mutation.isPending}
                    className="cursor-pointer rounded-lg bg-gray-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-600 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleMove}
                    disabled={!targetId || mutation.isPending}
                    className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {mutation.isPending ? 'Moving...' : 'Move content'}
                </button>
            </div>
        </div>
    </Modal>
  )
}

export default MoveContentDialog