"use client";

import { useEffect, useState } from "react";
import { Section } from "@/components/ui/section";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DeviceRegisterForm } from "@/features/devices/components/device-register-form";
import { DevicesList } from "@/features/devices/components/devices-list";
import { fetchDevices, linkDevice, registerDevice, toggleDevice } from "@/features/devices/api";
import { DeviceItem, RegisterDeviceResult } from "@/features/devices/types";
import { FeedbackBanner } from "@/components/ui/feedback-banner";

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [pendingDeleteDevice, setPendingDeleteDevice] = useState<{ id: number; name: string } | null>(null);
  const [createdDevice, setCreatedDevice] = useState<RegisterDeviceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadDevices = async (mountedRef?: { current: boolean }) => {
    setError(null);
    try {
      const data = await fetchDevices();
      if (mountedRef && !mountedRef.current) return;
      setDevices(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudieron cargar los dispositivos.";
      if (mountedRef && !mountedRef.current) return;
      setError(message);
    }
  };

  const onRequestDelete = (deviceId: number, deviceName: string) => {
    setPendingDeleteDevice({ id: deviceId, name: deviceName });
  };

  const confirmDeleteDevice = async () => {
    if (!pendingDeleteDevice) return;

    setRemovingId(pendingDeleteDevice.id);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Integrate the real device removal request when a frontend API endpoint is available.
      throw new Error("La eliminación de dispositivos todavía no está disponible en el servidor.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo eliminar el dispositivo.";
      setError(message);
    } finally {
      setRemovingId(null);
      setPendingDeleteDevice(null);
    }
  };

  useEffect(() => {
    const mounted = { current: true };
    async function initialize() {
      setIsLoading(true);
      await loadDevices(mounted);
      if (mounted.current) setIsLoading(false);
    }
    void initialize();
    return () => {
      mounted.current = false;
    };
  }, []);

  const onRegister = async (name: string, identifier: string) => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      const data = await registerDevice({ name, identifier });
      setCreatedDevice(data);
      setSuccess("Dispositivo registrado. Ahora puedes vincularlo.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo registrar el dispositivo.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onLinkCreated = async (deviceId: number) => {
    setError(null);
    setSuccess(null);
    setIsLinking(true);
    try {
      await linkDevice(deviceId);
      await loadDevices();
      setSuccess("Dispositivo vinculado correctamente.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo vincular el dispositivo.";
      setError(message);
    } finally {
      setIsLinking(false);
    }
  };

  const onToggle = async (deviceId: number) => {
    setError(null);
    setSuccess(null);
    setTogglingId(deviceId);
    try {
      await toggleDevice(deviceId);
      await loadDevices();
      setSuccess("Estado del dispositivo actualizado.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar el estado del dispositivo.";
      setError(message);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="dashboard-grid">
      <Section title="Dispositivos" subtitle="Registro, vínculo y control de tus dispositivos IoT">
        {success ? <FeedbackBanner type="success" message={success} /> : null}
        {error ? <FeedbackBanner type="error" message={error} /> : null}

        <div className="devices-grid">
          <DeviceRegisterForm
            isSubmitting={isSubmitting}
            isLinking={isLinking}
            success={null}
            error={null}
            createdDevice={createdDevice}
            onRegister={onRegister}
            onLinkCreated={onLinkCreated}
          />

          <DevicesList
            devices={devices}
            isLoading={isLoading}
            error={null}
            togglingId={togglingId}
            onToggle={onToggle}
            onRequestDelete={onRequestDelete}
          />
        </div>
      </Section>

      <ConfirmDialog
        open={pendingDeleteDevice != null}
        title="Eliminar dispositivo"
        description={`Esta acción quitará ${pendingDeleteDevice?.name ?? "el dispositivo"} de tu lista de gestión. ¿Deseas continuar?`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        isProcessing={removingId != null}
        onConfirm={confirmDeleteDevice}
        onCancel={() => setPendingDeleteDevice(null)}
      />
    </div>
  );
}
