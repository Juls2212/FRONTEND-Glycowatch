"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLoginForm } from "@/features/auth/use-login-form";
import { useAuthStore } from "@/stores/auth-store";
import { onboardingStorage } from "@/lib/auth/onboarding";

function resolvePostLoginPath(): string {
  return onboardingStorage.isProfilePending() ? "/profile" : "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useLoginForm();

  useEffect(() => {
    if (isHydrated && accessToken) {
      router.replace(resolvePostLoginPath());
    }
  }, [isHydrated, accessToken, router]);

  const onSubmit = handleSubmit(async (values) => {
    await login(values);
    router.replace(resolvePostLoginPath());
  });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-eyebrow">Bienvenido</p>
        <h1 className="auth-title">Inicia sesión en GlycoWatch</h1>
        <p className="auth-subtitle">Monitorea métricas glucémicas desde un panel profesional.</p>

        <form onSubmit={onSubmit} className="auth-form">
          <label className="field">
            <span>Correo electrónico</span>
            <input type="email" placeholder="usuario@correo.com" {...register("email")} />
            {errors.email ? <small>{errors.email.message}</small> : null}
          </label>

          <label className="field">
            <span>Contraseña</span>
            <input type="password" placeholder="••••••••" {...register("password")} />
            {errors.password ? <small>{errors.password.message}</small> : null}
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading ? "Ingresando..." : "Entrar"}
          </button>
        </form>

        <p className="auth-switch">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="auth-link">
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}

