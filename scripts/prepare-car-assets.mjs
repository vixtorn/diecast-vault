import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

const projectRoot = process.cwd()
const carsDataPath = path.join(projectRoot, 'src', 'data', 'cars.ts')
const sourceRoot = path.join(projectRoot, 'public')
const outputDir = path.join(projectRoot, 'public', 'cars-clean')

fs.mkdirSync(outputDir, { recursive: true })

const carsSource = fs.readFileSync(carsDataPath, 'utf8')
const imageUrls = Array.from(carsSource.matchAll(/imageUrl:\s*'([^']+)'/g))
  .map((match) => match[1])
  .filter((url, index, urls) => urls.indexOf(url) === index)

function pixelIndex(width, x, y) {
  return (y * width + x) << 2
}

function isLikelyCheckerBackground(data, index) {
  const r = data[index]
  const g = data[index + 1]
  const b = data[index + 2]
  const a = data[index + 3]
  const spread = Math.max(r, g, b) - Math.min(r, g, b)
  const brightness = (r + g + b) / 3

  return a > 0 && spread <= 28 && brightness >= 176
}

function transparentizeConnectedBackground(png) {
  const { width, height, data } = png
  const seen = new Uint8Array(width * height)
  const queue = []

  function enqueue(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return
    }

    const linear = y * width + x
    if (seen[linear]) {
      return
    }

    const index = pixelIndex(width, x, y)
    if (!isLikelyCheckerBackground(data, index)) {
      return
    }

    seen[linear] = 1
    queue.push([x, y])
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0)
    enqueue(x, height - 1)
  }

  for (let y = 0; y < height; y += 1) {
    enqueue(0, y)
    enqueue(width - 1, y)
  }

  let removed = 0

  while (queue.length > 0) {
    const [x, y] = queue.shift()
    const index = pixelIndex(width, x, y)
    data[index + 3] = 0
    removed += 1

    enqueue(x + 1, y)
    enqueue(x - 1, y)
    enqueue(x, y + 1)
    enqueue(x, y - 1)
  }

  // Soft cleanup for checker pixels left inside car windows or wheel gaps.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = pixelIndex(width, x, y)
      if (data[index + 3] !== 0 && isLikelyCheckerBackground(data, index)) {
        const nearbyTransparent =
          data[pixelIndex(width, Math.max(0, x - 1), y) + 3] === 0 ||
          data[pixelIndex(width, Math.min(width - 1, x + 1), y) + 3] === 0 ||
          data[pixelIndex(width, x, Math.max(0, y - 1)) + 3] === 0 ||
          data[pixelIndex(width, x, Math.min(height - 1, y + 1)) + 3] === 0

        if (nearbyTransparent) {
          data[index + 3] = 0
          removed += 1
        }
      }
    }
  }

  return removed
}

function cropToAlphaBounds(png, padding = 18) {
  const { width, height, data } = png
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[pixelIndex(width, x, y) + 3] > 8) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return png
  }

  minX = Math.max(0, minX - padding)
  minY = Math.max(0, minY - padding)
  maxX = Math.min(width - 1, maxX + padding)
  maxY = Math.min(height - 1, maxY + padding)

  const croppedWidth = maxX - minX + 1
  const croppedHeight = maxY - minY + 1
  const cropped = new PNG({ width: croppedWidth, height: croppedHeight })

  for (let y = 0; y < croppedHeight; y += 1) {
    for (let x = 0; x < croppedWidth; x += 1) {
      const sourceIndex = pixelIndex(width, minX + x, minY + y)
      const targetIndex = pixelIndex(croppedWidth, x, y)
      cropped.data[targetIndex] = data[sourceIndex]
      cropped.data[targetIndex + 1] = data[sourceIndex + 1]
      cropped.data[targetIndex + 2] = data[sourceIndex + 2]
      cropped.data[targetIndex + 3] = data[sourceIndex + 3]
    }
  }

  return cropped
}

const report = []

for (const imageUrl of imageUrls) {
  const sourceUrl = imageUrl.replace('/cars-clean/', '/cars/')
  const sourcePath = path.join(sourceRoot, sourceUrl.replace(/^\//, ''))
  const outputPath = path.join(outputDir, path.basename(imageUrl))

  if (!fs.existsSync(sourcePath)) {
    report.push({ imageUrl: sourceUrl, status: 'missing' })
    continue
  }

  const png = PNG.sync.read(fs.readFileSync(sourcePath))
  const removed = transparentizeConnectedBackground(png)
  const cropped = cropToAlphaBounds(png)
  fs.writeFileSync(outputPath, PNG.sync.write(cropped))

  report.push({
    imageUrl,
    removed,
    status: removed > 0 ? 'cleaned' : 'unchanged',
    output: `/cars-clean/${path.basename(imageUrl)}`,
  })
}

console.log('[prepare-car-assets] PNG transparency report:')
for (const item of report) {
  if (item.status === 'missing') {
    console.log(`- MISSING ${item.imageUrl}`)
  } else {
    console.log(`- ${item.status.toUpperCase()} ${item.imageUrl} -> ${item.output} (${item.removed} pixels transparentized)`)
  }
}
