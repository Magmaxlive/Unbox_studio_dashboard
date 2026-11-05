
interface ButtonProps {
    title? : string;
    handleCreate? : ()=> void
}

const CreateButton = ({title = 'create',handleCreate}:ButtonProps) => {
  return (
    <button type='button' onClick={handleCreate} className="cursor-pointer rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 capitalize">+ {title}</button>
  )
}

export default CreateButton
