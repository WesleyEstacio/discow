function hexToRgb(hexColor: string): [number, number, number] {
  return [
    Number.parseInt(hexColor.slice(1, 3), 16),
    Number.parseInt(hexColor.slice(3, 5), 16),
    Number.parseInt(hexColor.slice(5, 7), 16),
  ]
}

export function colorDistance(firstHexColor: string, secondHexColor: string): number {
  const [firstRed, firstGreen, firstBlue] = hexToRgb(firstHexColor)
  const [secondRed, secondGreen, secondBlue] = hexToRgb(secondHexColor)
  // "Redmean" weighting - cheap and much closer to perceived difference
  // than plain RGB distance.
  const meanRed = (firstRed + secondRed) / 2
  const redDelta = firstRed - secondRed
  const greenDelta = firstGreen - secondGreen
  const blueDelta = firstBlue - secondBlue
  return Math.sqrt(
    (2 + meanRed / 256) * redDelta ** 2 +
      4 * greenDelta ** 2 +
      (2 + (255 - meanRed) / 256) * blueDelta ** 2
  )
}
