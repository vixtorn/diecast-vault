import type { DiecastCar } from '../types/car'

type AuditResult = {
  imageUrl: string
  hasTransparentPixels: boolean
  loadable: boolean
  name: string
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

async function auditImage(car: DiecastCar): Promise<AuditResult> {
  try {
    const image = await loadImage(car.imageUrl)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })

    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight

    if (!context) {
      return {
        imageUrl: car.imageUrl,
        hasTransparentPixels: false,
        loadable: true,
        name: car.name,
      }
    }

    context.drawImage(image, 0, 0)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    let hasTransparentPixels = false

    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] < 250) {
        hasTransparentPixels = true
        break
      }
    }

    return {
      imageUrl: car.imageUrl,
      hasTransparentPixels,
      loadable: true,
      name: car.variant ? `${car.name} ${car.variant}` : car.name,
    }
  } catch {
    return {
      imageUrl: car.imageUrl,
      hasTransparentPixels: false,
      loadable: false,
      name: car.variant ? `${car.name} ${car.variant}` : car.name,
    }
  }
}

export async function auditCarAssets(cars: DiecastCar[]) {
  const uniqueCars = Array.from(new Map(cars.map((car) => [car.imageUrl, car])).values())
  const results = await Promise.all(uniqueCars.map(auditImage))
  const missingTransparency = results.filter(
    (result) => result.loadable && !result.hasTransparentPixels,
  )
  const failed = results.filter((result) => !result.loadable)

  if (missingTransparency.length > 0) {
    console.warn(
      `[Diecast Vault asset audit] These PNGs do not contain real transparent pixels and should be replaced with true transparent PNGs: ${missingTransparency
        .map((result) => `${result.name} (${result.imageUrl})`)
        .join(', ')}`,
    )
  }

  if (failed.length > 0) {
    console.error(
      `[Diecast Vault asset audit] These car image paths failed to load: ${failed
        .map((result) => `${result.name} (${result.imageUrl})`)
        .join(', ')}`,
    )
  }

  if (missingTransparency.length === 0 && failed.length === 0) {
    console.info('[Diecast Vault asset audit] All car PNGs loaded with transparent pixels.')
  }

  return results
}
