import { Modal, Stepper, Button, Group } from "@mantine/core";
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
      title="Calibrate sensor"
      size="lg"
      closeOnClickOutside={false}
      closeButtonProps={{ "aria-label": "Close calibration wizard" }}
    >
      <Stepper
        active={step}
        allowNextStepsSelect={false}
        size="sm"
        iconSize={22}
        styles={{ stepBody: { display: "none" } }}
      >
        <Stepper.Step label="Prepare">
          <PrepareStep />
        </Stepper.Step>

        <Stepper.Step label="Wake device">
          <WakeDeviceStep
            calibrationExpired={calibrationExpired}
            timedOut={timedOut}
            onRetry={restartCalibration}
          />
        </Stepper.Step>

        <Stepper.Step label="Dry reading">
          <DryReadingStep
            calibrationExpired={calibrationExpired}
            timedOut={timedOut}
            readingRejected={readingRejected}
            countdownKey={countdownKey}
            onRetry={restartCalibration}
          />
        </Stepper.Step>

        <Stepper.Step label="Wet reading">
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
            Done
          </Button>
        ) : isAutoAdvanceStep ? (
          <Button variant="default" onClick={prevStep}>Back</Button>
        ) : (
          <>
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleNext()}
              loading={calibrationStarting}
              disabled={!deviceId}
            >
              Start calibration
            </Button>
          </>
        )}
      </Group>
    </Modal>
  );
}
