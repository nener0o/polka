"use client";

import { useActionState } from "react";
import { loginAction, registerAction } from "@/actions/auth";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="flex flex-col gap-4" key={state?.values?.email ?? "login"}>
      <FormError state={state} />
      <input type="hidden" name="next" value={next ?? "/"} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Почта</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.values?.email ?? ""}
          className="h-10"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-10"
        />
      </div>
      <Button type="submit" disabled={pending} className="h-10">
        {pending ? "Входим…" : "Войти"}
      </Button>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(registerAction, null);
  return (
    <form action={action} className="flex flex-col gap-4" key={state?.values?.email ?? "register"}>
      <FormError state={state} />
      <input type="hidden" name="next" value={next ?? "/"} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Имя</Label>
        <Input
          id="name"
          name="name"
          autoComplete="nickname"
          required
          defaultValue={state?.values?.name ?? ""}
          className="h-10"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Почта</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.values?.email ?? ""}
          className="h-10"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className="h-10"
        />
      </div>
      <Button type="submit" disabled={pending} className="h-10">
        {pending ? "Создаём…" : "Создать аккаунт"}
      </Button>
    </form>
  );
}
