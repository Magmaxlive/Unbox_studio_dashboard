import { useState,useEffect } from 'react'
import Modal from '../ui/Modal'

interface RejectDialogProps{
    isOpen : boolean;
    blogTitle : string;
    isSubmitting : boolean;
    apiFieldErrors : Record<string,string>;
    onConfirm : (reason : string) => void;
    onClose : ()=> void;
}

function RejectDialog({isOpen,blogTitle,isSubmitting,apiFieldErrors,onConfirm,onClose}:RejectDialogProps) {
    const [reason,setReason] = useState('')
    const [localError,setLocalError] = useState('')

    // start fresh each time the dialog opens
    useEffect(()=>{
        if (isOpen) {
            setReason('');
            setLocalError('');
        }
    },[isOpen])

    const handleClose = () =>{
        if (isSubmitting) return ;
        onClose();
    }

    const handleSubmit = (event:React.FormEvent) => {
        event.preventDefault();

        const trimmed = reason.trim();
        if (!trimmed){
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
        title='Reject blog'
        description={`The author will see this reason and can resubmit "${blogTitle}" after making changes . `}
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
                    placeholder="e.g. Please add sources for the statistics in the second section."
                    value={reason}
                    aria-invalid ={Boolean(errorMessage)}
                    onChange={(e)=>setReason(e.target.value)}
                />

                {errorMessage && (
                    <p className="text-xs mt-1 5 text-red-500" role='alert'>{errorMessage}</p>
                )}

            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                type='button'
                onClick={handleClose}
                disabled={isSubmitting}
                className="cursor-pointer capitalize rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                cancel
                </button>

                <button 
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer capitalizee rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSubmitting ? 'rejecting' : 'reject blog'}
                </button>
            </div>

        </form>
      
    </Modal>
  )
}

export default RejectDialog
