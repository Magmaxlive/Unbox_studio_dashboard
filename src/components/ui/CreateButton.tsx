import {PlusIcon} from 'lucide-react'

interface ButtonProps {
    title? : string;
    handleCreate? : ()=> void
}

const CreateButton = ({title = 'create',handleCreate}:ButtonProps) => {
  return (
    <button type='button' onClick={handleCreate} className="flex items-center gap-1 cursor-pointer rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 capitalize"><PlusIcon size={15}/> {title}</button>
  )
}

export default CreateButton
