import { ArrowLeft,LockIcon, Home, ShieldOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/images/logo.png'

const Unauthorized = () => {
  const navigate = useNavigate()

  return (
    <div className='relative flex min-h-screen flex-col bg-ink text-white overflow-hidden'>
      {/* Backdrop: grid + gradient blobs */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 opacity-[0.06]'
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
        }}
      />
      <div
        aria-hidden
        className='pointer-events-none absolute -top-48 -left-48 h-[520px] w-[520px] rounded-full blur-3xl opacity-30'
        style={{ background: 'radial-gradient(circle, var(--violet) 0%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className='pointer-events-none absolute -bottom-48 -right-48 h-[520px] w-[520px] rounded-full blur-3xl opacity-20'
        style={{ background: 'radial-gradient(circle, var(--cyan) 0%, transparent 70%)' }}
      />

      {/* Top bar */}
      <header className='relative z-10 flex items-center justify-between px-8 py-6'>
        <img src={logo} alt='Unbox' className='h-6 w-auto object-contain opacity-90' />
        <span className='font-body text-xs uppercase tracking-[0.25em] text-soft'>
          Studio Dashboard
        </span>
      </header>

      {/* Main */}
      <main className='relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16'>
        {/* Status badge */}
        <div className='mb-10 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-transparentbg px-4 py-1.5 backdrop-blur-sm'>
          <span className='text-volt'>
            <LockIcon size={15} />
          </span>
          <span className='font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-soft'>
            Access Denied
          </span>
        </div>

        {/* 403 with chromatic aberration */}
        <div className='relative select-none leading-none'>
          <span
            aria-hidden
            className='absolute inset-0 font-heading font-black tracking-widest text-cyan opacity-70 blur-[1px]'
            style={{
              fontSize: 'clamp(6rem, 22vw, 12rem)',
              transform: 'translate(-6px, 4px)',
            }}
          >
            403
          </span>
          <span
            aria-hidden
            className='absolute inset-0 font-heading font-black tracking-widest text-violet opacity-70 blur-[1px]'
            style={{
              fontSize: 'clamp(6rem, 22vw, 12rem)',
              transform: 'translate(6px, -4px)',
            }}
          >
            403
          </span>
          <h1
            className='relative font-heading font-black tracking-widest text-white'
            style={{ fontSize: 'clamp(6rem, 22vw, 12rem)' }}
          >
            403
          </h1>
        </div>

        {/* Divider with icon */}
        <div className='mt-8 mb-6 flex items-center gap-4'>
          <div className='h-px w-16 bg-white/15' />
          <ShieldOff className='h-5 w-5 text-volt' strokeWidth={2} />
          <div className='h-px w-16 bg-white/15' />
        </div>

        {/* Text */}
        <h2 className='font-body text-lg font-semibold uppercase tracking-[0.35em] text-white'>
          Unauthorized
        </h2>
        <p className='mt-3 max-w-md text-center text-sm text-soft tracking-wide'>
          You don't have permission to view this feature. If you think this is a
          mistake, please contact your workspace administrator.
        </p>

        {/* Actions */}
        <div className='mt-10 flex flex-col-reverse items-center gap-3 sm:flex-row'>
          <button
            type='button'
            onClick={() => navigate(-1)}
            className='group inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/15 bg-transparentbg px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white backdrop-blur-sm transition hover:bg-white/10'
          >
            <ArrowLeft className='h-4 w-4 transition group-hover:-translate-x-0.5' />
            Go Back
          </button>
          <Link
            to='/dashboard'
            className='group cursor-pointer inline-flex items-center gap-2 rounded-md bg-violet px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-violet/30 transition hover:bg-violet-deep'
          >
            <Home className='h-4 w-4' />
            Return to Dashboard
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className='relative z-10 flex md:flex-row flex-col gap-3 items-center justify-between px-8 py-6 text-xs text-soft'>
        <span className='font-mono tracking-wider opacity-70'>ERR_CODE: 403_FORBIDDEN</span>
        <span className='tracking-wider opacity-70'>Unbox Studio · Content Management</span>
      </footer>
    </div>
  )
}

export default Unauthorized
