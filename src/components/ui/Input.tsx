import type { InputHTMLAttributes } from "react";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>,
'name'|'value'|'onChange'|'onBlur'> & {
    field:{
        name:string;
        state:{
            value:string;
            meta:{
                isTouched:boolean;
                errors:unknown[];
            };
        };
        handleBlur: ()=>void;
        handleChange: (value:string)=>void;
    };
};

export function Input({field,type='text',placeholder,autoComplete,...props}:InputProps){
    const hasError = field.state.meta.isTouched && field.state.meta.errors.length > 0
    return(
        <div className="w-full">
            <input
            {...props}
            id={field.name}
            name={field.name}
            type={type}
            autoComplete={autoComplete}
            placeholder={placeholder}
            onBlur={field.handleBlur}
            onChange={(e)=>field.handleChange(e.target.value)}
            value={field.state.value}
            aria-invalid={hasError}
            className={`w-full rounded-md border bg-neutral-300 px-4 py-3 text-sm outline-none text-ink transition placeholder:text-neutral-600 focus:ring-2 ${
                hasError
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : "border-white/10 focus:border-violet focus:ring-violet/20"
                }`}
            />

            {hasError && (
                <p className="mt-2 text-sm text-red-400" role="alert">
                    {field.state.meta.errors.map(String).join(", ")}
                </p>
            )}
        </div>
    )

}