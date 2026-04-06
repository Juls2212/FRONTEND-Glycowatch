"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerRequest } from "@/features/auth/api";
import { useRegisterForm } from "@/features/auth/use-register-form";
import { onboardingStorage } from "@/lib/auth/onboarding";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useRegisterForm();

  const onSubmit = handleSubmit(async (values) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await registerRequest(values);
      onboardingStorage.markProfilePending();
      setSuccess("Cuenta creada correctamente. Inicia sesion para completar tu perfil.");
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
      <div className="auth-card">
        <p className="auth-eyebrow">Registro</p>
        <h1 className="auth-title">Crea tu cuenta en GlycoWatch</h1>
        <p className="auth-subtitle">Configura tu acceso para comenzar a monitorear tus metricas.</p>

        <form onSubmit={onSubmit} className="auth-form">
          <label className={`field ${errors.fullName ? "has-error" : ""}`}>
            <span>Nombre completo</span>
            <input
              type="text"
              placeholder="Nombre Apellido"
              aria-invalid={errors.fullName ? "true" : "false"}
              aria-describedby={errors.fullName ? "register-full-name-error" : undefined}
              disabled={isLoading}
              {...register("fullName")}
            />
            {errors.fullName ? <small id="register-full-name-error">{errors.fullName.message}</small> : null}
          </label>

          <label className={`field ${errors.email ? "has-error" : ""}`}>
            <span>Correo electronico</span>
            <input
              type="email"
              placeholder="usuario@correo.com"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "register-email-error" : undefined}
              disabled={isLoading}
              {...register("email")}
            />
            {errors.email ? <small id="register-email-error">{errors.email.message}</small> : null}
          </label>

          <label className={`field ${errors.password ? "has-error" : ""}`}>
            <span>Contrasena</span>
            <input
              type="password"
              placeholder="••••••••"
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "register-password-error" : undefined}
              disabled={isLoading}
              {...register("password")}
            />
            {errors.password ? <small id="register-password-error">{errors.password.message}</small> : null}
          </label>

          {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}
          {success ? <p className="form-feedback form-feedback-success">{success}</p> : null}

          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="auth-switch">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="auth-link">
            Iniciar sesion
          </Link>
        </p>
      </div>
    </div>
  );
}
