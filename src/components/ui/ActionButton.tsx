import { type ButtonHTMLAttributes,type ReactNode } from "react"

interface ActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>,'OnClick' | 'disabled' | 'type'>{
    onClick : ()=> void;
    children : ReactNode;

    // when set , the button is shown as disabled and this text explains why
    disabledReason? : string | null;
    className? : string;
    // classes applied only when enabled
    enabledClassName? : string;
    // classes applied only when disabled
    disabledClassName ? : string;
}

const ActionButton = ({onClick,children,disabledReason = null,className = '',enabledClassName = '',disabledClassName='cursor-not-allowed border-gray-100 text-gray-300',...props}:ActionButtonProps) => {
    const isDisabled = Boolean(disabledReason)
  return (
    <button
    {...props}
    type="button"
    aria-disabled={isDisabled}
    title={disabledReason ?? undefined}
    onClick={()=>{
        if (!isDisabled) onClick();
    }}
    className={`${className} relative ${isDisabled ? disabledClassName : `${enabledClassName} cursor-pointer` }`}
    >
      {children}
      {isDisabled && <span className="sr-only">({disabledReason})</span>}
    </button>
  )
}

export default ActionButton
