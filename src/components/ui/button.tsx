import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-200 ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:scale-[0.97] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:grayscale-[0.6] aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "rounded-2xl border-4 border-dashed border-primary-foreground/80 bg-gradient-to-br from-primary to-primary-glow bg-[length:130%_130%] bg-[position:0%_0%] font-extrabold tracking-wide text-primary-foreground shadow-lg shadow-primary/30 hover:-translate-y-1 hover:scale-[1.02] hover:border-primary-foreground hover:bg-[position:100%_100%] hover:shadow-2xl hover:shadow-primary/50 hover:ring-4 hover:ring-primary/25 active:translate-y-0 active:scale-[0.98]",
        outline:
          "border-border bg-background hover:border-primary/50 hover:bg-primary/5 hover:text-primary aria-expanded:border-primary/50 aria-expanded:bg-primary/5 aria-expanded:text-primary dark:border-input dark:bg-input/30 dark:hover:border-primary/40 dark:hover:bg-primary/10",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-[color-mix(in_oklch,var(--secondary),var(--primary)_14%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-primary/10 hover:text-primary aria-expanded:bg-primary/10 aria-expanded:text-primary dark:hover:bg-primary/15",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 hover:shadow-sm hover:shadow-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:text-primary-glow hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2.5 px-6 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-11",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        size: "default",
        class:
          "h-12 gap-2.5 px-7 text-base has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
      },
      {
        variant: "default",
        size: "lg",
        class:
          "h-14 gap-3 px-8 text-lg has-data-[icon=inline-end]:pr-6 has-data-[icon=inline-start]:pl-6",
      },
      {
        variant: "default",
        size: "sm",
        class:
          "h-10 gap-2 px-5 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
      },
      {
        variant: "default",
        size: "xs",
        class:
          "h-8 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
