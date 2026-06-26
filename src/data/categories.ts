import type { CategoryFilter, CarCategory } from '../types/car'

export type CategoryOption = {
  id: CategoryFilter
  label: string
  eyebrow: string
}

export const categoryLabels: Record<CarCategory, string> = {
  'fast-furious': 'Fast & Furious',
  jdm: 'JDM',
  'euro-icons': 'Euro Icons',
}

export const categories: CategoryOption[] = [
  {
    id: 'fast-furious',
    label: 'Fast & Furious',
    eyebrow: 'Movie legends',
  },
  {
    id: 'jdm',
    label: 'JDM',
    eyebrow: 'Japan icons',
  },
  {
    id: 'euro-icons',
    label: 'Euro Icons',
    eyebrow: 'Poster cars',
  },
]
