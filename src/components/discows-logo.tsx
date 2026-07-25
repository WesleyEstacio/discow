import Image from "next/image"

type DiscowsLogoProps = {
  size?: number
  className?: string
}

export function DiscowsLogo({ size = 64, className = "" }: DiscowsLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Discows"
      width={size}
      height={size}
      priority
      className={`rounded-2xl select-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  )
}
