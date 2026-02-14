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

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      await register(name, email, password, passwordConfirmation);
      router.push(`/check-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        if (err.errors) {
          setFieldErrors(err.errors);
        }
      } else {
        setError(t("registerError"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return fieldErrors[field]?.[0];
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/90 backdrop-blur">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-600">
          <Sword className="h-7 w-7 text-white" />
        </div>
        <CardTitle className="text-2xl text-zinc-100">{t("register")}</CardTitle>
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
            <Label htmlFor="name" className="text-zinc-300">
              {t("name")}
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              className="border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder:text-zinc-500 focus:border-red-600 focus:ring-red-600"
            />
            {getFieldError("name") && (
              <p className="text-sm text-red-500">{getFieldError("name")}</p>
            )}
          </div>

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
            {getFieldError("email") && (
              <p className="text-sm text-red-500">{getFieldError("email")}</p>
            )}
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
            {getFieldError("password") && (
              <p className="text-sm text-red-500">{getFieldError("password")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password_confirmation" className="text-zinc-300">
              {t("confirmPassword")}
            </Label>
            <Input
              id="password_confirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
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
                {t("registering")}
              </>
            ) : (
              t("registerButton")
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-center text-sm">
        <div className="w-full text-zinc-400">
          {t("hasAccount")}{" "}
          <Link
            href="/login"
            className="text-red-500 transition-colors hover:text-red-400 hover:underline"
          >
            {t("login")}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
