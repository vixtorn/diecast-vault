import { motion } from 'framer-motion'
import { categories } from '../../data/categories'
import type { CategoryFilter } from '../../types/car'

type CategoryControlsProps = {
  activeCategory: CategoryFilter
  counts: Record<CategoryFilter, number>
  onCategoryChange: (category: CategoryFilter) => void
}

export function CategoryControls({
  activeCategory,
  counts,
  onCategoryChange,
}: CategoryControlsProps) {
  return (
    <nav className="category-dock" aria-label="Collections">
      {categories.map((category) => {
        const isActive = category.id === activeCategory

        return (
          <button
            className="dock-button"
            data-active={isActive}
            key={category.id}
            type="button"
            onClick={() => onCategoryChange(category.id)}
          >
            {isActive && (
              <motion.span
                className="dock-indicator"
                layoutId="category-indicator"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span>{category.label}</span>
            <small>{counts[category.id]}</small>
          </button>
        )
      })}
    </nav>
  )
}
