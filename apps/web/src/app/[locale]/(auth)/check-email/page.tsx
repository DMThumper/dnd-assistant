"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CheckEmailPage() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) return;

    setError(null);
    setResendSuccess(false);
    setIsResending(true);

    try {
      await api.resendVerification(email);
      setResendSuccess(true);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError(t("resendError"));
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/90 backdrop-blur">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-600">
          <Mail className="h-7 w-7 text-white" />
        </div>
        <CardTitle className="text-2xl text-zinc-100">
          {t("checkEmail")}
        </CardTitle>
        <CardDescription className="text-zinc-400">
          {t("checkEmailDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="border-red-900 bg-red-950/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {resendSuccess && (
          <Alert className="border-green-900 bg-green-950/50 text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{t("emailResent")}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
          <p className="text-center text-sm text-zinc-300">
            {t("emailSentTo")}
          </p>
          <p className="mt-1 text-center font-medium text-zinc-100">{email}</p>
        </div>

        <div className="space-y-2 text-center text-sm text-zinc-400">
          <p>{t("checkSpam")}</p>
          <p>{t("verificationRequired")}</p>
        </div>

        <Button
          variant="outline"
          className="w-full border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          onClick={handleResend}
          disabled={isResending || !email}
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("resending")}
            </>
          ) : (
            t("resendEmail")
          )}
        </Button>
      </CardContent>
      <CardFooter className="text-center text-sm">
        <div className="w-full text-zinc-400">
          <Link
            href="/login"
            className="text-red-500 transition-colors hover:text-red-400 hover:underline"
          >
            {t("backToLogin")}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
