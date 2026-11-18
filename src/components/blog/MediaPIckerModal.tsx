import { useState } from 'react'
import { Check, ImageOff } from 'lucide-react'
import Modal from '../ui/Modal'
import Pagination from '../ui/Pagination'
import { useAuth } from '../../contexts/AuthContext'
import { useMediaAssets } from '../../hooks/queries/media'
import type { MediaAsset, MediaFilter } from '../../types/Media'
import UseDebounce from '../../hooks/UseDebounce'

const PAGE_SIZE = 12;

interface MediaPickerModalProps {
    isOpen : boolean;
    selectedId? : string;
    onClose : () => void;
    onSelect : (asset:MediaAsset) => void;
}

const MediaPickerModal = ({ isOpen, selectedId, onClose, onSelect }:MediaPickerModalProps) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [page,setPage] = useState(1);
    const [searchInput,setSearchInput] = useState('');
    const search = UseDebounce(searchInput.trim());

    // only ready images: exactly what a blog cover may use
    const filters : MediaFilter = { media_type : 'image', status : 'ready', page };
    if (search) filters.search = search;

    // fetch only while the picker is open
    const { data, isLoading, isError, refetch, isFetching } = useMediaAssets(filters, { enabled : isOpen });

    const assets = data?.results ?? [];
    const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);

    const renderBody = () => {
        if (isLoading) {
            return <p className="py-10 text-center text-sm text-gray-500">Loading images...</p>
        }

        if (isError) {
            return (
                <div className="py-10 text-center">
                    <p className="text-sm text-red-600">Couldn't load images.</p>
                    <button
                        type="button"
                        onClick={()=>refetch()}
                        className="mt-3 cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                    >
                        Retry
                    </button>
                </div>
            )
        }

        if (!assets.length) {
            return (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-500">
                    <ImageOff size={24} />
                    <p className="text-sm">
                        {search ? 'No images match your search.' : 'No images yet. Upload one from the cover image field.'}
                    </p>
                </div>
            )
        }

        return (
            <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
                {assets.map((asset)=>{
                    const isSelected = asset.id === selectedId;
                    return (
                        <button
                            key={asset.id}
                            type="button"
                            onClick={()=>onSelect(asset)}
                            aria-pressed={isSelected}
                            className={`group relative cursor-pointer overflow-hidden rounded-lg border-2 text-left transition ${
                                isSelected ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
                            }`}
                        >
                            {asset.thumbnail_url && (
                                <img
                                    src={asset.thumbnail_url}
                                    alt={asset.alt_text}
                                    loading="lazy"
                                    className="aspect-square w-full bg-gray-100 object-cover"
                                />
                            )}
                            {isSelected && (
                                <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-gray-900 text-white">
                                    <Check size={14} />
                                </span>
                            )}
                            <span className="block truncate px-1.5 pt-1.5 text-xs text-gray-700" title={asset.file_name}>
                                {asset.file_name}
                            </span>
                            {isAdmin && (
                                <span className="block truncate px-1.5 pb-1.5 text-[11px] capitalize text-gray-400">
                                    {asset.uploaded_by_name}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
        )
    }

  return (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Choose an image"
        description={isAdmin ? 'All uploaded images.' : 'Images you have uploaded.'}
        maxWidth="max-w-3xl"
    >
        <div className="flex flex-col gap-4">
            <input
                type="search"
                value={searchInput}
                onChange={(e)=>{ setSearchInput(e.target.value); setPage(1); }}
                placeholder="Search by file name or alt text..."
                aria-label="Search images"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
            />

            {renderBody()}

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                isLoading={isFetching}
            />
        </div>
    </Modal>
  )
}

export default MediaPickerModal