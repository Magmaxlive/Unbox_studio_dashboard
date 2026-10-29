import React from 'react'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { loginSchema } from '../../../schemas/auth/loginSchema'
import type { LoginFormValues } from '../../../schemas/auth/loginSchema'
import { login } from '../../../api/auth'
import { email } from 'zod'
import logo from '../../../assets/images/logo.png'
import { zodValidator } from '../../../lib/validators'
import { Input } from '../../ui/Input'



const LoginPage = () => {
    const [serverError,setServerError] = useState("")

    const form = useForm({
        defaultValues:{
            email : "",
            password : "",
        } as LoginFormValues,

        onSubmit: async ({value}) => {
            setServerError("");

            const result = loginSchema.safeParse(value);
            if(!result.success){
                return ;
            }

            // api call
            try {
                await login(result.data.email,result.data.password);
                alert("Login successfull")
            } catch (error) {
                setServerError("Unable to sign in . Check your credentials")
            }

        }
    })
  return (
    
<div className="flex min-h-screen items-center justify-center bg-white px-4 py-10">
  <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-white/10 bg-ink text-white shadow-2xl">

    {/* Brand header */}
    <div className="flex flex-col items-center justify-center gap-3 bg-violet px-6 py-5">
      <img
        src={logo}
        alt="Unbox logo"
        className="h-auto w-32 object-contain"
      />
    </div>

    {/* Login content */}
    <div className="px-8 py-4">
      <div className="flex flex-col gap-1 text-center">
        <h4 className="text-xl font-semibold capitalize tracking-wider">
          Welcome back
        </h4>

        <p className="text-sm text-neutral-400">
          Sign in to continue.
        </p>
      </div>

      <form
      className='space-y-5 my-5'
      noValidate
      onSubmit={(e)=>{
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
      >

        <form.Field
        name = 'email' 
        validators={{
            onBlur: zodValidator(loginSchema.shape.email)
        }}
        >
            {(field)=>(
                <div className='flex flex-col gap-1'>
                    <label htmlFor={field.name} className="mb-2 block text-sm font-medium text-neutral-200" >Email address</label>
                    <Input field={field} type='email' placeholder='your@example.com' autoComplete='username' />
                </div>
            )}

        </form.Field>

        <form.Field 
        name =
        >

        </form.Field>

      </form>

      
    </div>

  </div>
</div>

  )
}

export default LoginPage
