
interface ConfirmDialogProps{
  isOpen : boolean;
  title:string;
  description:string;
  confirmText?:string;
  loadingText?:string;
  variant?:'danger' | 'default';
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

const ConfirmDialog = ({isOpen,title,loadingText='Deleting...',variant='danger',description,confirmText='delete',isLoading=false,onConfirm,onClose}:ConfirmDialogProps) => {
  if (!isOpen) return null;
  const styles = VARIANT_STYLES[variant];
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

        <div className="flex justify-end gap-3">
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
            disabled={isLoading}
            className={`rounded-lg cursor-pointer capitalize px-4 py-2 text-sm font-medium text-white ${styles.button} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isLoading ? loadingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog

