import { X } from "lucide-react"
import { useCategoryOptions } from "../../hooks/queries/categories"
import type { BlogBulkMode,BulkModeConfig } from "./blogBulkActions"
import { pluraliseBlogs } from "./blogBulkActions"

interface BulkActionBarProps{
    mode : BlogBulkMode;
    config : BulkModeConfig;
    selectedCount : number;
    category : string;
    onCategoryChange : (id:string) => void;
    onApply : ()=> void;
    onExit : ()=> void;
    isBusy : boolean;
}

const BulkActionBar = ({mode,config,selectedCount,category,onCategoryChange,onApply,onExit,isBusy}:BulkActionBarProps) => {
    const { data:categoryOptions = [] } = useCategoryOptions();
    const activeCategories = categoryOptions.filter((c)=>c.is_active);

    const needsCategory = mode === 'category';
    const canApply = selectedCount > 0 && (!needsCategory || Boolean(category)) && !isBusy;

  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-gray-900 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
                Bulk {config.label.toLowerCase()} . {selectedCount} selected
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
                {config.description}
            </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
            {needsCategory && (
                <select
                    value={category}
                    onChange={(e)=>onCategoryChange(e.target.value)}
                    aria-label = 'Move to category'
                    className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm capitalize outline-none focus:border-gray-900"
                >
                    <option value="">Move to..</option>
                    {
                        activeCategories.map((cat)=>(
                            <option key={cat.id} value={cat.id} >{cat.name}</option>
                        ))
                    }

                </select>
            )}

            <button
                type="button"
                onClick={onApply}
                disabled={!canApply}
                className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-gray-300 ${config.buttonClass}`}
            >
                {config.verb} {pluraliseBlogs(selectedCount)}

            </button>

            <button
                type="button"
                onClick={onExit}
                disabled={isBusy}
                className="flex cursor-pointer items-center gap-1 rounded-lg bg-gray-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-600 disabled:opacity-50"
            >

            <X size={14} /> Exit
            
            </button>
        </div>
      
    </div>
  )
}

export default BulkActionBar
