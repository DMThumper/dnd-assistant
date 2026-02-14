"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sword, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { login, hasBackofficeAccess } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);

      // Redirect based on role
      if (hasBackofficeAccess) {
        router.push("/dashboard");
      } else {
        router.push("/player");
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        // Check if requires verification
        if ((err as ApiClientError & { requiresVerification?: boolean }).requiresVerification) {
          router.push(`/check-email?email=${encodeURIComponent(email)}`);
          return;
        }
        setError(err.message);
      } else {
        setError(t("loginError"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/90 backdrop-blur">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-600">
          <Sword className="h-7 w-7 text-white" />
        </div>
        <CardTitle className="text-2xl text-zinc-100">{t("login")}</CardTitle>
        <CardDescription className="text-zinc-400">
          {tCommon("appName")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="border-red-900 bg-red-950/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">
              {t("email")}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder:text-zinc-500 focus:border-red-600 focus:ring-red-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">
              {t("password")}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder:text-zinc-500 focus:border-red-600 focus:ring-red-600"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("loggingIn")}
              </>
            ) : (
              t("loginButton")
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 text-center text-sm">
        <Link
          href="/forgot-password"
          className="text-zinc-400 transition-colors hover:text-zinc-200"
        >
          {t("forgotPassword")}
        </Link>
        <div className="text-zinc-400">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="text-red-500 transition-colors hover:text-red-400 hover:underline"
          >
            {t("register")}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
