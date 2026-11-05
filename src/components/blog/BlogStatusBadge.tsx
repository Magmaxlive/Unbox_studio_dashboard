import { BLOG_STATUS_CONFIG } from './blogStatus'
import type { BlogStatus } from '../../types/Blogs'

interface BlogStatusBadgeProps{
    status : BlogStatus
}

const BlogStatusBadge = ({status}:BlogStatusBadgeProps) => {
    const config = BLOG_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

export default BlogStatusBadge
