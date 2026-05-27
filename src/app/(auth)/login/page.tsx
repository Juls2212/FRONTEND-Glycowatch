"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onboardingStorage } from "@/lib/auth/onboarding";
import { normalizeEmailInput, trimInputValue } from "@/lib/forms/input-normalizers";
import { useLoginForm } from "@/features/auth/use-login-form";
import { useAuthStore } from "@/stores/auth-store";

function resolvePostLoginPath(): string {
  return onboardingStorage.isProfilePending() ? "/onboarding" : "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
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

  const emailRegistration = register("email");
  const passwordRegistration = register("password");

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
      <div className="auth-layout auth-layout-login">
        <section className="auth-hero-panel">
          <div className="auth-hero-copy">
            <p className="auth-eyebrow">Cuidado continuo</p>
            <h1 className="auth-hero-title">Tu seguimiento glucémico en un entorno más claro y humano.</h1>
            <p className="auth-hero-subtitle">
              Accede a GlycoWatch para revisar tu estado reciente, registrar nuevas mediciones y continuar con un monitoreo más tranquilo.
            </p>
          </div>

          <div className="auth-hero-grid">
            <div className="auth-hero-card">
              <span className="auth-hero-card-label">Monitoreo diario</span>
              <strong>Lecturas, alertas y evolución reciente en un solo lugar.</strong>
            </div>
            <div className="auth-hero-card">
              <span className="auth-hero-card-label">Acompañamiento inteligente</span>
              <strong>Interpretaciones clínicas para entender mejor tus cambios recientes.</strong>
            </div>
          </div>
        </section>

        <section className="auth-card auth-form-panel">
          <div className="auth-form-copy">
            <p className="auth-eyebrow">Bienvenido</p>
            <h2 className="auth-title">Inicia sesión en GlycoWatch</h2>
            <p className="auth-subtitle">Ingresa con tu cuenta para retomar tu seguimiento de salud.</p>
          </div>

          <form onSubmit={onSubmit} className="auth-form">
            <label className={`field ${errors.email ? "has-error" : ""}`}>
              <span>Correo electrónico</span>
              <input
                type="email"
                placeholder="usuario@correo.com"
                maxLength={254}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "login-email-error" : undefined}
                disabled={isLoading}
                {...emailRegistration}
                onInput={(event) => {
                  event.currentTarget.value = normalizeEmailInput(event.currentTarget.value);
                }}
                onBlur={(event) => {
                  event.currentTarget.value = trimInputValue(event.currentTarget.value);
                  emailRegistration.onBlur(event);
                }}
              />
              {errors.email ? <small id="login-email-error">{errors.email.message}</small> : null}
            </label>

            <label className={`field ${errors.password ? "has-error" : ""}`}>
              <span>Contraseña</span>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  maxLength={72}
                  placeholder="••••••••"
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "login-password-error" : undefined}
                  disabled={isLoading}
                  {...passwordRegistration}
                  onBlur={(event) => {
                    event.currentTarget.value = trimInputValue(event.currentTarget.value);
                    passwordRegistration.onBlur(event);
                  }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={isLoading}
                  className="password-toggle"
                >
                  <span aria-hidden="true">{showPassword ? "Ocultar" : "Mostrar"}</span>
                </button>
              </div>
              {errors.password ? <small id="login-password-error">{errors.password.message}</small> : null}
            </label>

            {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

            <div className="auth-actions">
              <button type="submit" className="primary-button" disabled={isLoading}>
                {isLoading ? "Ingresando..." : "Entrar"}
              </button>
            </div>
          </form>

          <p className="auth-switch">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="auth-link">
              Crear cuenta
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
