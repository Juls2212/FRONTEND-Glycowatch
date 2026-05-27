"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerRequest } from "@/features/auth/api";
import { useRegisterForm } from "@/features/auth/use-register-form";
import { onboardingStorage } from "@/lib/auth/onboarding";
import { normalizeEmailInput, trimInputValue } from "@/lib/forms/input-normalizers";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useRegisterForm();

  const fullNameRegistration = register("fullName");
  const emailRegistration = register("email");
  const passwordRegistration = register("password");

  const onSubmit = handleSubmit(async (values) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await registerRequest(values);
      onboardingStorage.markProfilePending();
      setSuccess("Cuenta creada correctamente. Inicia sesión para completar tu perfil.");
      setTimeout(() => router.replace("/login"), 900);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear la cuenta.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <div className="auth-page">
      <div className="auth-layout auth-layout-register">
        <section className="auth-hero-panel">
          <div className="auth-hero-copy">
            <p className="auth-eyebrow">Primer paso</p>
            <h1 className="auth-hero-title">Comienza tu experiencia de monitoreo con una cuenta pensada para salud digital.</h1>
            <p className="auth-hero-subtitle">
              Crea tu acceso para registrar mediciones, visualizar tu evolución reciente y preparar una experiencia más personalizada.
            </p>
          </div>

          <div className="auth-hero-grid">
            <div className="auth-hero-card">
              <span className="auth-hero-card-label">Perfil guiado</span>
              <strong>Completa tus datos clínicos paso a paso después de ingresar por primera vez.</strong>
            </div>
            <div className="auth-hero-card">
              <span className="auth-hero-card-label">Seguimiento claro</span>
              <strong>Consulta tu evolución con una interfaz más tranquila y orientada a la comprensión.</strong>
            </div>
          </div>
        </section>

        <section className="auth-card auth-form-panel">
          <div className="auth-form-copy">
            <p className="auth-eyebrow">Registro</p>
            <h2 className="auth-title">Crea tu cuenta en GlycoWatch</h2>
            <p className="auth-subtitle">Usa tus datos básicos para activar tu acceso y continuar con el onboarding clínico.</p>
          </div>

          <form onSubmit={onSubmit} className="auth-form">
            <label className={`field ${errors.fullName ? "has-error" : ""}`}>
              <span>Nombre completo</span>
              <input
                type="text"
                placeholder="Nombre Apellido"
                maxLength={100}
                aria-invalid={errors.fullName ? "true" : "false"}
                aria-describedby={errors.fullName ? "register-full-name-error" : undefined}
                disabled={isLoading}
                {...fullNameRegistration}
                onBlur={(event) => {
                  event.currentTarget.value = trimInputValue(event.currentTarget.value);
                  fullNameRegistration.onBlur(event);
                }}
              />
              {errors.fullName ? <small id="register-full-name-error">{errors.fullName.message}</small> : null}
            </label>

            <label className={`field ${errors.email ? "has-error" : ""}`}>
              <span>Correo electrónico</span>
              <input
                type="email"
                placeholder="usuario@correo.com"
                maxLength={254}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "register-email-error" : undefined}
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
              {errors.email ? <small id="register-email-error">{errors.email.message}</small> : null}
            </label>

            <label className={`field ${errors.password ? "has-error" : ""}`}>
              <span>Contraseña</span>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  maxLength={72}
                  placeholder="••••••••"
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "register-password-error" : undefined}
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
              {errors.password ? <small id="register-password-error">{errors.password.message}</small> : null}
            </label>

            {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}
            {success ? <p className="form-feedback form-feedback-success">{success}</p> : null}

            <div className="auth-actions">
              <button type="submit" className="primary-button" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </div>
          </form>

          <p className="auth-switch">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="auth-link">
              Iniciar sesión
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
