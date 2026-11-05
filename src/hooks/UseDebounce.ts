import { useEffect,useState } from "react";

const UseDebounce = <T>(value:T,delay=400) : T => {
    const [debouncedValue,setDebouncedValue] = useState(value)
    useEffect(()=>{
        const timer = setTimeout(()=>{
            setDebouncedValue(value);
        },delay)

        return ()=> clearTimeout(timer)
    },[value,delay])
    
    return debouncedValue
}

export default UseDebounce
