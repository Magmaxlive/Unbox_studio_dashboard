import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import type { BulkNoun } from '../bulk/bulkActions'

interface RejectDialogProps {
    isOpen : boolean;
    noun : BulkNoun;
    itemTitle : string;
    isSubmitting : boolean;
    apiFieldErrors : Record<string, string>;
    onConfirm : (reason:string) => void;
    onClose : () => void;
}

function RejectDialog({isOpen, noun, itemTitle, isSubmitting, apiFieldErrors, onConfirm, onClose}:RejectDialogProps) {
    const [reason, setReason] = useState('');
    const [localError, setLocalError] = useState('');

    // start fresh each time the dialog opens
    useEffect(()=>{
        if (isOpen) {
            setReason('');
            setLocalError('');
        }
    },[isOpen])

    const handleClose = () => {
        if (isSubmitting) return;
        onClose();
    }

    const handleSubmit = (event:React.FormEvent) => {
        event.preventDefault();

        const trimmed = reason.trim();
        if (!trimmed) {
            setLocalError('Please tell the author what needs to change');
            return;
        }

        setLocalError('');
        onConfirm(trimmed);
    }

    const errorMessage = localError || apiFieldErrors.reason;

  return (
    <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`Reject ${noun.singular}`}
        description={`The author will see this reason and can resubmit "${itemTitle}" after making changes.`}
    >
        <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
                <label htmlFor="reject-reason" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Reason
                </label>

                <textarea
                    name="reject-reason"
                    id="reject-reason"
                    rows={4}
                    placeholder={noun.singular === 'video'
                        ? 'e.g. The audio is hard to hear in the first half. Please re-upload with clearer sound.'
                        : 'e.g. Please add sources for the statistics in the second section.'}
                    value={reason}
                    aria-invalid={Boolean(errorMessage)}
                    onChange={(e)=>setReason(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
                />

                {errorMessage && (
                    <p className="mt-1.5 text-xs text-red-500" role='alert'>{errorMessage}</p>
                )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                    type='button'
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="cursor-pointer rounded-lg bg-gray-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-600 disabled:opacity-50"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="cursor-pointer rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSubmitting ? 'Rejecting...' : `Reject ${noun.singular}`}
                </button>
            </div>
        </form>
    </Modal>
  )
}

export default RejectDialog