import { Button } from "../components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { supabase } from '../lib/supabase'

export function LoginPage() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Welcome to BaitoAI</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="default" 
            className="w-full"
            onClick={handleLogin}
          >
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
