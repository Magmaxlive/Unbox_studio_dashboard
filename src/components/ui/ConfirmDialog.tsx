import React from 'react'

interface ConfirmDialogProps{
  isOpen : boolean;
  title:string;
  description:string;
  confirmText?:string;
  isLoading?:boolean;
  onConfirm : () => void;
  onClose : () => void;
}

const ConfirmDialog = ({isOpen,title,description,confirmText='delete',isLoading=false,onConfirm,onClose}:ConfirmDialogProps) => {
  if (!isOpen) return null;
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]'>
      <div role='alertdialog' aria-modal='true' className="bg-white rounded-2xl p-6 flex flex-col gap-2 w-full max-w-md shadow-2xl">
        <div className="flex size-11 items-center justify-center rounded-full bg-red-50 text-red-600">
          <span className='text-xl'>!</span>
        </div>
        <h2 className="text-lg capitalize font-semibold text-gray-900">
          {title}
        </h2>
        <p className="text-sm leading-6 text-gray-500">
          {description}
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog

