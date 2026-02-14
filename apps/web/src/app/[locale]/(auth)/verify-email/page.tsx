"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type VerificationStatus = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<VerificationStatus>("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      const id = searchParams.get("id");
      const hash = searchParams.get("hash");
      const expires = searchParams.get("expires");
      const signature = searchParams.get("signature");

      if (!id || !hash || !expires || !signature) {
        setStatus("error");
        setError(t("invalidVerificationLink"));
        return;
      }

      try {
        const response = await api.verifyEmail(id, hash, expires, signature);

        if (response.data.token) {
          api.setToken(response.data.token);
        }

        setStatus("success");

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch (err) {
        setStatus("error");
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError(t("verificationError"));
        }
      }
    };

    void verifyEmail();
  }, [searchParams, router, t]);

  return (
    <Card className="border-zinc-800 bg-zinc-900/90 backdrop-blur">
      <CardHeader className="text-center">
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            status === "verifying"
              ? "bg-zinc-700"
              : status === "success"
                ? "bg-green-600"
                : "bg-red-600"
          }`}
        >
          {status === "verifying" && (
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          )}
          {status === "success" && (
            <CheckCircle2 className="h-7 w-7 text-white" />
          )}
          {status === "error" && <XCircle className="h-7 w-7 text-white" />}
        </div>
        <CardTitle className="text-2xl text-zinc-100">
          {status === "verifying" && t("verifying")}
          {status === "success" && t("emailVerified")}
          {status === "error" && t("verificationFailed")}
        </CardTitle>
        <CardDescription className="text-zinc-400">
          {status === "verifying" && t("verifyingDescription")}
          {status === "success" && t("emailVerifiedDescription")}
          {status === "error" && error}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "success" && (
          <div className="rounded-lg border border-green-900 bg-green-950/50 p-4 text-center">
            <p className="text-sm text-green-400">{t("redirecting")}</p>
          </div>
        )}
        {status === "error" && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4 text-center">
            <p className="text-sm text-zinc-400">{t("verificationHelp")}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-center text-sm">
        {status === "error" && (
          <div className="w-full text-zinc-400">
            <Link
              href="/login"
              className="text-red-500 transition-colors hover:text-red-400 hover:underline"
            >
              {t("backToLogin")}
            </Link>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
