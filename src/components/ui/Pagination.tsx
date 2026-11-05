interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: number[] = [];

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 2) {
      end = Math.min(5, totalPages);
    }

    if (currentPage >= totalPages - 1) {
      start = Math.max(1, totalPages - 4);
    }

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  const buttonClass =
    "flex size-9 cursor-pointer items-center justify-center rounded-lg text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex flex-col gap-4 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-500">
        Page <span className="font-medium text-gray-900">{currentPage}</span>{" "}
        of <span className="font-medium text-gray-900">{totalPages}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className={`${buttonClass} border border-gray-200 px-3 hover:bg-gray-700 hover:text-white`}
        >
          Prev
        </button>

        {visiblePages[0] > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              disabled={isLoading}
              className={`${buttonClass} hover:bg-gray-700 hover:text-white`}
            >
              1
            </button>
            {visiblePages[0] > 2 && (
              <span className="px-1 text-gray-400">...</span>
            )}
          </>
        )}

        {visiblePages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            disabled={isLoading || currentPage === page}
            aria-current={currentPage === page ? "page" : undefined}
            className={`${buttonClass} ${
              currentPage === page
                ? "bg-gray-900 text-white"
                : "text-gray-700 hover:bg-gray-700 hover:text-white"
            }`}
          >
            {page}
          </button>
        ))}

        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <span className="px-1 text-gray-400">...</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              disabled={isLoading}
              className={`${buttonClass} hover:bg-gray-700 hover:text-white`}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className={`${buttonClass} border border-gray-200 px-3 hover:bg-gray-700 hover:text-white`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;