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
        <h1 className="auth-title">Inicia sesion en GlycoWatch</h1>
        <p className="auth-subtitle">Monitorea metricas glucemicas desde un panel profesional.</p>

        <form onSubmit={onSubmit} className="auth-form">
          <label className={`field ${errors.email ? "has-error" : ""}`}>
            <span>Correo electronico</span>
            <input
              type="email"
              placeholder="usuario@correo.com"
              maxLength={254}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              disabled={isLoading}
              {...register("email")}
            />
            {errors.email ? <small id="login-email-error">{errors.email.message}</small> : null}
          </label>

          <label className={`field ${errors.password ? "has-error" : ""}`}>
            <span>Contrasena</span>
            <input
              type="password"
              maxLength={72}
              placeholder="••••••••"
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              disabled={isLoading}
              {...register("password")}
            />
            {errors.password ? <small id="login-password-error">{errors.password.message}</small> : null}
          </label>

          {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

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
