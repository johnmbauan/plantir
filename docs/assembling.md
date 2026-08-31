# Assembling and setting up a Plantir sensor

Step-by-step guide to build a humidity sensor and register it in the Plantir app.

## Step 1: Hardware connection

Connect the capacitive humidity probe to the FireBeetle board. Ground and the analog signal pin are the same on both boards; **sensor power is not**. Board-specific notes are in [Electronics](./electronics.md).

Probe wires are usually: black = ground, red = VCC, yellow = analog out (`AOUT` / `AUOUT`).

### FireBeetle 2 ESP32-C5

The C5 has a switched 3.3 V output (`3V3_C`) that firmware turns off in deep sleep. Wire the probe to that pin, not the always-on `3V3` pin.

- Ground (black) → `GND`
- VCC (red) → `3V3_C`
- Analog out (yellow) → `A1`

### FireBeetle 2 ESP32-C6

The C6 `3V3` pin stays powered in deep sleep, so a probe wired there would keep drawing current. Firmware instead powers the probe from **pin A3** (high while measuring, held low during sleep).

- Ground (black) → `GND`
- VCC (red) → `A3`
- Analog out (yellow) → `A1`

Do not connect the probe VCC to `3V3`.

## Step 2: Firmware upload

Upload the `humidity_remote_controlled` sketch with the [Arduino IDE](https://www.arduino.cc/en/software/). Follow the board-specific notes in the [README](../README.md) and [Electronics](./electronics.md).

For FireBeetle 2 ESP32-C5/C6, use **Partition Scheme → Minimal SPIFFS (1.9MB APP with OTA)** so the sensor can receive future firmware updates over the air (HTTPS) after this one-time USB flash. Later release steps are in [Firmware releases](./firmware-releases.md).

> **ESP32-C6 — entering download mode:**
> Before the Arduino IDE can flash the sketch, put the board in download mode manually:
> 1. Press the boot and reset buttons together, then release them immediately.
>
> Start **Sketch → Upload** right away.

## Step 3: Register the sensor

In the Plantir web app, open **Plants Center → Sensors** and follow the **Register new sensor** wizard.

## Step 4: Calibrate the sensor

Still in the Plantir web app, follow the **Calibrate sensor** wizard (offered at the end of registration, or later from the Sensors list / sensor settings).

## Step 5: Reporting interval and plant assignment

In the sensor settings (Plants Center), set how often the sensor should wake and measure (commonly between 8 and 24 hours) and assign a plant if you skipped that during registration.

When adding or editing the plant, you can optionally set **pot height**. The capacitive probe only senses about **7 cm** of soil. In taller pots, moisture often remains higher toward the bottom, so a dry surface reading can understate how wet the pot still is. Setting pot height lets the app adjust the humidity shown on the dashboard and in watering alerts; the sensor still stores the raw probe reading.

Insert the probe so the full sensing length (about 7 cm) is in the soil — do not leave half of it above the surface.

## Step 6: Power connection

Connect the battery to the ESP32 board. Check polarity for your pack and board. For example, FireBeetle boards use a JST PH 2.0 battery connector; some batteries ship with reversed polarity and need the wires swapped to match the board.

## Step 7: Final assembly

Place the electronics in the case, mount them securely, and close it. Setup is complete.
