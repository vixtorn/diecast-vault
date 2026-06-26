import { useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CONFIG } from './gridConfig'
import { calculateGridDimensions, matchesFilter } from './gridState'
import { getBasePosition } from './gridLayout'
import { CarTile } from './CarTile'
import type { CategoryFilter, DiecastCar } from '../../types/car'

type GridCanvasProps = {
  cars: DiecastCar[]
  filter: CategoryFilter
  gridVisible: boolean
  interactive: boolean
  transitionStartTime: number
}

export function GridCanvas({
  cars,
  filter,
  gridVisible,
  interactive,
  transitionStartTime,
}: GridCanvasProps) {
  const { mappedCars, gridDims } = useMemo(() => {
    const filteredCars = cars.filter((car) => matchesFilter(car, filter))
    const dims = calculateGridDimensions(filteredCars.length)
    const maxDelay = gridVisible ? CONFIG.enterStaggerDelay : CONFIG.exitStaggerDelay

    return {
      gridDims: dims,
      mappedCars: cars.map((car, index) => {
        const matches = matchesFilter(car, filter)
        const positionIndex = matches
          ? cars.slice(0, index).filter((item) => matchesFilter(item, filter)).length
          : index
        const basePos = getBasePosition(positionIndex, matches ? filteredCars.length : cars.length)

        return {
          ...car,
          basePos,
          index,
          matchesFilter: matches,
          randomDelay: (((index * 37) % 100) / 100) * maxDelay,
        }
      }),
    }
  }, [cars, filter, gridVisible])

  const [mountedCount, setMountedCount] = useState(gridVisible ? 0 : cars.length)

  useFrame(() => {
    if (mountedCount < mappedCars.length) {
      setMountedCount((current) => Math.min(current + 5, mappedCars.length))
    }
  })

  return (
    <>
      {mappedCars.map((car, index) => {
        if (index > mountedCount) return null

        return (
          <CarTile
            basePos={car.basePos}
            car={car}
            gridHeight={gridDims.height}
            gridVisible={gridVisible}
            index={car.index}
            interactive={interactive && car.matchesFilter}
            key={car.id}
            transitionStartTime={transitionStartTime}
          />
        )
      })}
    </>
  )
}
