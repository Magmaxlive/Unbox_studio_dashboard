import React from 'react'
import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps{
    isOpen : boolean,
    onClose : () => void;
    title : string;
    description?:string;
    children : React.ReactNode;
    maxWidth?:string
}

const Modal = ({isOpen,onClose,title,description,children,maxWidth= "max-w-lg"}:ModalProps) => {
    useEffect(()=>{
        if (!isOpen) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key == 'Escape') onClose();
        };

        document.addEventListener('keydown',handleEscape)
        document.body.style.overflow = 'hidden'

        return ()=>{
            document.removeEventListener('keydown',handleEscape);
            document.body.style.overflow = "";
        }
    },[isOpen,onClose])

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]'>
            <div role='dialog' aria-modal='true' aria-labelledby='modal-title' className={`w-full ${maxWidth} flex flex-col animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-hidden`}>
                <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
                    <div>
                        <h2 id='modal-title' className="text-lg capitalize font-semibold text-gray-900">
                            {title}
                        </h2>

                        {description && (
                            <p className="mt-1 text-sm text-gray-500">
                                {description}
                            </p>
                        )}

                        
                    </div>

                   <button className="rounded-lg cursor-pointer p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700" onClick={onClose}>
                            <X size={18} />
                    </button>
                </div>
                 <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">{children}</div>
            </div>
        </div>
    )
}

export default Modal
