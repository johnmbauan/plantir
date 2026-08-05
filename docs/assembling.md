# Assembling and setting up a Plantir device

Step-by-step guide to build a humidity sensor and register it in the Plantir app.

## Step 1: Hardware connection

Connect the humidity sensor to the ESP32 board. Wiring depends on your board; for FireBeetle 2 ESP32-C5/C6 see [Electronics](./electronics.md).

## Step 2: Firmware upload

Upload the `humidity_remote_controlled` sketch with the [Arduino IDE](https://www.arduino.cc/en/software/). Follow the board-specific notes in the [README](../README.md) and [Electronics](./electronics.md).

For FireBeetle 2 ESP32-C5/C6, use **Partition Scheme → Minimal SPIFFS (1.9MB APP with OTA)** so the device can receive future firmware updates over the air (HTTPS) after this one-time USB flash. Later release steps are in [Firmware releases](./firmware-releases.md).

> **ESP32-C6 — entering download mode:**
> Before the Arduino IDE can flash the sketch, put the board in download mode manually:
> 1. Press the boot and reset buttons together, then release them immediately.
>
> Start **Sketch → Upload** right away.

## Step 3: Register the device

In the Plantir web app, open **Plants Center → Devices** and follow the **Register new device** wizard.

## Step 4: Calibrate the sensor

Still in the Plantir web app, follow the **Calibrate sensor** wizard (offered at the end of registration, or later from the Devices list / device settings).

## Step 5: Reporting interval and plant assignment

In the device settings (Plants Center), set how often the device should wake and measure (commonly between 8 and 24 hours) and assign a plant if you skipped that during registration.

## Step 6: Power connection

Connect the battery to the ESP32 board. Check polarity for your pack and board. For example, FireBeetle boards use a JST PH 2.0 battery connector; some batteries ship with reversed polarity and need the wires swapped to match the board.

## Step 7: Final assembly

Place the electronics in the case, mount them securely, and close it. Setup is complete.
