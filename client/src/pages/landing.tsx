import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import OpianLogo from "@/assets/opian-logo";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <OpianLogo className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Opian Core</CardTitle>
          <CardDescription>
            Professional client management platform for consultants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleLogin}
            className="w-full"
            size="lg"
            data-testid="button-login"
          >
            Sign In to Continue
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Manage clients, create quotes, schedule meetings, and more
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
