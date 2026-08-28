import { Modal, Stepper, Button, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useCalibrationWizard } from "./hooks/useCalibrationWizard";
import PrepareStep from "./steps/PrepareStep";
import WakeDeviceStep from "./steps/WakeDeviceStep";
import DryReadingStep from "./steps/DryReadingStep";
import WetReadingStep from "./steps/WetReadingStep";
import CalibrationCompleteStep from "./steps/CalibrationCompleteStep";

interface Props {
  opened: boolean;
  onClose: () => void;
  deviceId: number | null;
  onCalibrated?: () => void;
}

export default function DeviceCalibrationWizard({ opened, onClose, deviceId, onCalibrated }: Props) {
  const { t } = useTranslation();
  const {
    step,
    calibrationStarting,
    timedOut,
    readingRejected,
    calibrationExpired,
    countdownKey,
    saving,
    isCompleted,
    isAutoAdvanceStep,
    handleClose,
    handleNext,
    prevStep,
    restartCalibration,
  } = useCalibrationWizard({ opened, deviceId, onClose, onCalibrated });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t("calibrationWizard.title")}
      size="lg"
      closeOnClickOutside={false}
      closeButtonProps={{ "aria-label": t("calibrationWizard.closeAria") }}
    >
      <Stepper
        active={step}
        allowNextStepsSelect={false}
        size="sm"
        iconSize={22}
        styles={{ stepBody: { display: "none" } }}
      >
        <Stepper.Step label={t("calibrationWizard.steps.prepare")}>
          <PrepareStep />
        </Stepper.Step>

        <Stepper.Step label={t("calibrationWizard.steps.wakeDevice")}>
          <WakeDeviceStep
            calibrationExpired={calibrationExpired}
            timedOut={timedOut}
            onRetry={restartCalibration}
          />
        </Stepper.Step>

        <Stepper.Step label={t("calibrationWizard.steps.dryReading")}>
          <DryReadingStep
            calibrationExpired={calibrationExpired}
            timedOut={timedOut}
            readingRejected={readingRejected}
            countdownKey={countdownKey}
            onRetry={restartCalibration}
          />
        </Stepper.Step>

        <Stepper.Step label={t("calibrationWizard.steps.wetReading")}>
          <WetReadingStep
            calibrationExpired={calibrationExpired}
            timedOut={timedOut}
            readingRejected={readingRejected}
            countdownKey={countdownKey}
            saving={saving}
            onRetry={restartCalibration}
          />
        </Stepper.Step>

        <Stepper.Completed>
          <CalibrationCompleteStep />
        </Stepper.Completed>
      </Stepper>

      <Group justify="space-between" mt="xl">
        {isCompleted ? (
          <Button fullWidth onClick={handleClose}>
            {t("common.done")}
          </Button>
        ) : isAutoAdvanceStep ? (
          <Button variant="default" onClick={prevStep}>{t("common.back")}</Button>
        ) : (
          <>
            <Button variant="default" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => void handleNext()}
              loading={calibrationStarting}
              disabled={!deviceId}
            >
              {t("calibrationWizard.startCalibration")}
            </Button>
          </>
        )}
      </Group>
    </Modal>
  );
}
