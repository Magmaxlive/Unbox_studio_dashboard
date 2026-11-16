import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

// Shown when a page crashes while rendering (React Router errorElement).
// API failures are handled by each page; unknown URLs go to NotFound.
const RouteErrorPage = () => {
    const error = useRouteError();

    const details = isRouteErrorResponse(error)
        ? `${error.status} ${error.statusText}`
        : error instanceof Error
            ? error.message
            : String(error);

    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <AlertTriangle size={22} />
                </div>

                <h1 className="mt-4 text-lg font-semibold text-gray-900">Something went wrong</h1>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                    This page ran into an unexpected problem. Your saved work is safe.
                    Try again, or go back to the dashboard.
                </p>

                {/* developer-only details */}
                {import.meta.env.DEV && (
                    <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-gray-50 p-3 text-left text-xs text-red-700 whitespace-pre-wrap">
                        {details}
                    </pre>
                )}

                <div className="mt-6 flex justify-center gap-3">
                    <button
                        type="button"
                        onClick={()=>window.location.reload()}
                        className="cursor-pointer rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                    >
                        Try again
                    </button>
                    <Link
                        to="/dashboard"
                        className="rounded-lg bg-gray-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-600"
                    >
                        Go to dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default RouteErrorPage