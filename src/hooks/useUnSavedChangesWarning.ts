import { useEffect } from "react"

const useUnSavedChangesWarning = (enabled : boolean) => {
 useEffect(()=>{
    if (!enabled) return;

    const handleBeforeUnload = (event:BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = '';
    };

    window.addEventListener('beforeunload',handleBeforeUnload);
    return ()=> window.removeEventListener('beforeunload',handleBeforeUnload)
 },[enabled])
}

export default useUnSavedChangesWarning
