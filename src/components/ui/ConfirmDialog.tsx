import { useEffect, useState } from 'react'

interface ConfirmDialogProps{
  isOpen : boolean;
  title:string;
  description:string;
  confirmText?:string;
  loadingText?:string;
  variant?:'danger' | 'default';
  // when set, the confirm button only enables after typing this exact text
  confirmPhrase?:string;
  isLoading?:boolean;
  onConfirm : () => void;
  onClose : () => void;
}

const VARIANT_STYLES = {
  danger : {
    icon : 'bg-red-100 text-red-600',
    button : 'bg-red-600 hover:bg-red-700',
  },
  default : {
    icon : 'bg-gray-100 text-gray-700',
    button : 'bg-gray-900 hover:bg-gray-700',
  },
};

const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmText='delete',
  loadingText='Deleting...',
  variant='danger',
  confirmPhrase,
  isLoading=false,
  onConfirm,
  onClose,
}:ConfirmDialogProps) => {
  const [typed,setTyped] = useState('');

  // start empty each time it opens
  useEffect(()=>{
    if (isOpen) setTyped('');
  },[isOpen])

  if (!isOpen) return null;

  const styles = VARIANT_STYLES[variant];
  const phraseMatches = !confirmPhrase || typed.trim() === confirmPhrase;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]'>
      <div role='alertdialog' aria-modal='true' className="bg-white rounded-2xl p-6 flex flex-col gap-2 w-full max-w-md shadow-2xl">
        <div className={`flex size-11 items-center justify-center rounded-full ${styles.icon}`}>
          <span className='text-xl'>!</span>
        </div>
        <h2 className="text-lg capitalize font-semibold text-gray-900">
          {title}
        </h2>
        <p className="text-sm leading-6 text-gray-500">
          {description}
        </p>

        {confirmPhrase && (
          <label className="mt-1 block text-sm text-gray-700">
            Type <span className="font-semibold">{confirmPhrase}</span> to confirm
            <input
              type="text"
              value={typed}
              onChange={(e)=>setTyped(e.target.value)}
              autoFocus
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
            />
          </label>
        )}

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg cursor-pointer capitalize border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || !phraseMatches}
            className={`rounded-lg cursor-pointer capitalize px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${styles.button}`}
          >
            {isLoading ? loadingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog