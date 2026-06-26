export type CarCategory = 'fast-furious' | 'jdm' | 'euro-icons'

export type CategoryFilter = CarCategory

export type DiecastCar = {
  id: string
  name: string
  variant?: string
  categories: CarCategory[]
  imageUrl: string
}
