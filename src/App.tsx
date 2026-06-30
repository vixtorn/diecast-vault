import { useEffect, useMemo, useState } from 'react'
import { VantaCloudsBackground } from './components/background/VantaCloudsBackground'
import { CarGrid } from './components/grid/CarGrid'
import { CategoryControls } from './components/ui/CategoryControls'
import { CloseButton } from './components/ui/CloseButton'
import { Header } from './components/ui/Header'
import { MiniMap } from './components/ui/MiniMap'
import { RecenterButton } from './components/ui/RecenterButton'
import { cars } from './data/cars'
import { auditCarAssets } from './utils/auditAssets'
import { resetRigView } from './components/grid/gridState'
import type { CategoryFilter } from './types/car'

const categoryCounts: Record<CategoryFilter, number> = {
  'fast-furious': cars.filter((car) => car.categories.includes('fast-furious')).length,
  jdm: cars.filter((car) => car.categories.includes('jdm')).length,
  'euro-icons': cars.filter((car) => car.categories.includes('euro-icons')).length,
}

function App() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('fast-furious')

  const filteredCars = useMemo(() => {
    return cars.filter((car) => car.categories.includes(activeCategory))
  }, [activeCategory])

  function handleCategoryChange(category: CategoryFilter) {
    setActiveCategory(category)
    resetRigView({ syncCurrent: true })
  }

  useEffect(() => {
    void auditCarAssets(cars)
  }, [])

  return (
    <div className="app-shell">
      <VantaCloudsBackground />
      <Header />
      <CategoryControls
        activeCategory={activeCategory}
        counts={categoryCounts}
        onCategoryChange={handleCategoryChange}
      />
      <CarGrid activeCategory={activeCategory} cars={filteredCars} />
      <MiniMap count={filteredCars.length} />
      <CloseButton />
      <RecenterButton />
      <footer className="credit">
        Inspired by{' '}
        <a href="https://shoe-finder-wine.vercel.app/" target="_blank">
          Shoe Finder
        </a>{' '}
        by Matthew Greenberg ·{' '}
        <a href="https://github.com/MatthewGreenberg/shoe-finder" target="_blank">
          GitHub
        </a>
      </footer>
    </div>
  )
}

export default App
