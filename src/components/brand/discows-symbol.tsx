type BrandShape = {
  role: "ink" | "accent"
  fillRule: "nonzero" | "evenodd"
  d: string
}

const SYMBOL_SHAPES: BrandShape[] = [
  { role: "ink", fillRule: "evenodd", d: "M224.00 128.00A96 96 0 1 1 32.00 128.00A96 96 0 1 1 224.00 128.00ZM137.00 128.00A9 9 0 1 0 119.00 128.00A9 9 0 1 0 137.00 128.00Z" },
  { role: "accent", fillRule: "evenodd", d: "M176.93 119.37C178.50 135.71 169.16 137.94 156.28 152.96C143.41 167.98 140.53 179.92 125.43 179.46C110.33 178.99 106.75 167.20 95.88 151.09C85.01 134.99 77.49 129.29 81.95 115.04C86.40 100.79 96.69 100.95 113.71 94.09C130.72 87.23 134.19 81.28 150.00 87.60C165.80 93.92 175.35 103.03 176.93 119.37ZM137.00 128.00A9 9 0 1 0 119.00 128.00A9 9 0 1 0 137.00 128.00Z" },
]

type DiscowsSymbolProps = {
  size: number
  discColor: string
  labelColor: string
}

export function DiscowsSymbol({ size, discColor, labelColor }: DiscowsSymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" role="img" aria-label="Discows">
      {SYMBOL_SHAPES.map((shape) => (
        <path
          key={shape.role}
          d={shape.d}
          fillRule={shape.fillRule}
          fill={shape.role === "ink" ? discColor : labelColor}
        />
      ))}
    </svg>
  )
}
