import type { BlogCategorySummary } from "../../types/Blogs"

interface BlogCategoryBadgeProps{
    category:BlogCategorySummary | null
}

const BlogCategoryBadge = ({category}:BlogCategoryBadgeProps) => {
    if(!category){
        return <span className="text-xs text-gray-400 capitalize">uncategorised</span>
    }
  return (
    <span className="inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium capitalize"
    style={{ backgroundColor: category.color_hex , color:category.text_color_hex }}>
      {category.name}
    </span>
  )
}

export default BlogCategoryBadge
