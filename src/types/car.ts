export type CarCategory = 'fast-furious' | 'jdm' | 'euro-icons'

export type CategoryFilter = 'all' | CarCategory

export type DiecastCar = {
  id: string
  name: string
  variant?: string
  categories: CarCategory[]
  imageUrl: string
  featured?: boolean
  featuredOrder?: number
}
