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

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
          <Sword className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">{t("register")}</CardTitle>
        <CardDescription>{tCommon("appName")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" type="text" required />
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="password_confirmation">
              {t("confirmPassword")}
            </Label>
            <Input id="password_confirmation" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            {t("registerButton")}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-center text-sm">
        <div className="w-full text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link href="/login" className="text-primary hover:underline">
            {t("login")}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
