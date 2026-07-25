import { GoogleIcon } from "@/components/google-icon"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { signInWithGoogle } from "@/lib/auth-actions"
import { cn } from "@/lib/utils"

type LoginFormProps = React.ComponentProps<"div"> & {
  callbackUrl?: string
}

export function LoginForm({ className, callbackUrl, ...props }: LoginFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Discows</CardTitle>
          <CardDescription>
            Sign in with Google to catalog albums and write reviews.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signInWithGoogle}>
            <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/profile"} />
            <Button type="submit" className="w-full">
              <GoogleIcon data-icon="inline-start" className="size-4" />
              Continue with Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
