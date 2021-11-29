import { useEffect, useState} from 'react'

const useKeyPress = (domNode = document.body) => {
    const [key, setKey] = useState(null)
    useEffect(() => {
        const handlePress = (evt) => {
            setKey(evt.keyCode)
        }
        domNode.addEventListener("keypress", handlePress)
        return () => {
            domNode.removeEventListener("keypress", handlePress)
        }
    }, [domNode])
    return key
}

export default useKeyPress