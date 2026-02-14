"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
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
import { Sword } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
          <Sword className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">{t("login")}</CardTitle>
        <CardDescription>{tCommon("appName")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            {t("loginButton")}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-center text-sm">
        <Link
          href="/forgot-password"
          className="text-muted-foreground hover:text-foreground"
        >
          {t("forgotPassword")}
        </Link>
        <div className="text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href="/register" className="text-primary hover:underline">
            {t("register")}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
