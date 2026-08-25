# Firmware releases

How to build, stage, test, and roll out a new Plantir device firmware over the air (often called **OTA**: over-the-air updating).

Devices download firmware over HTTPS after they are registered. They do **not** need a USB cable for later updates, as long as they were once flashed with an over-the-air-capable partition layout (see [Electronics](./electronics.md) for FireBeetle board settings).

## Concepts

| Term | Meaning |
|------|---------|
| **Firmware version** (integer) | Number baked into the sketch as `FIRMWARE_VERSION` in [`Config.h`](../arduino/humidity_remote_controlled/Config.h). Devices compare this to the server and update when it differs. |
| **Semantic version** | Human label in Admin (e.g. `1.2.0`). Not used by the device. |
| **Staged release** | An uploaded `.bin` stored in Admin. Not yet what all devices use. |
| **Fleet** | The default release for every device of a given chip type (`esp32c5` or `esp32c6`). |
| **Pilot** | A temporary per-device override to test a staged release on selected devices before publishing to the fleet. |

## Prerequisites (one-time per device)

New or previously non-updatable devices need **one USB flash** with:

- Board: FireBeetle 2 ESP32-C5 or ESP32-C6 (matching the binary you will publish)
- **Flash Size**: `4MB`
- **Partition Scheme**: `Minimal SPIFFS (1.9MB APP with OTA / 128KB SPIFFS)`

Until that bootstrap flash is done, the device cannot install remote updates.

## Releasing a new firmware version

Do these steps in order for **each** board type you ship (C5 and C6 need **separate** builds and uploads).

### 1. Bump the integer in the sketch

1. Edit [`arduino/humidity_remote_controlled/Config.h`](../arduino/humidity_remote_controlled/Config.h).
2. Increase `FIRMWARE_VERSION` (e.g. `1` → `2`). This is the only version the device cares about.
3. Commit the sketch change with the rest of the firmware work.

### 2. Build and export the binary

In Arduino IDE, for the target board (e.g. `ESP32C6 Dev Module` or `ESP32C5 Dev Module`):

1. Confirm **Flash Size** `4MB` and **Partition Scheme** `Minimal SPIFFS (1.9MB APP with OTA / 190KB SPIFFS)`.
2. Apply other board settings from [Electronics](./electronics.md) (USB CDC, flash mode, etc.).
3. **Sketch → Verify/Compile** and confirm the sketch fits the ~1.9MB app slot.
4. **Sketch → Export compiled Binary**. Arduino writes several files under a `build/` folder; upload only the **app image**:

   | File | Upload for OTA? |
   |------|-----------------|
   | `humidity_remote_controlled.ino.bin` | **Yes** — this is the firmware image the device downloads |
   | `*.merged.bin` | No — full flash image for USB flashing |
   | `*.bootloader.bin`, `boot_app0.bin` | No — bootloader |
   | `*.partitions.bin` | No — partition table |
   | `*_flashed.bin` | No — flashing helpers, not the OTA payload |

Repeat for the other board if you support both C5 and C6 (each board needs its own `.ino.bin`).

### 3. Stage the release in Admin

1. Open **Admin → Firmware** in the Plantir web app (admin role required).
2. Upload the `humidity_remote_controlled.ino.bin` for that board with:
   - **Board** (`esp32c5` or `esp32c6`)
   - **Firmware version** — the same integer as `FIRMWARE_VERSION`
   - **Semantic version** — human label (e.g. `1.2.0`)
   - Optional **label** (e.g. `pilot-battery-fix`)
3. The release is **staged** only. The fleet default is unchanged until you publish.

### 4. Pilot on a few devices (recommended)

1. On the staged release row, click **Assign** and select one or more devices for that board.
2. Wait for those devices to wake (they may sleep for many hours).
3. In **Admin → Devices**, confirm each pilot shows the new integer under **Firmware**.
4. Verify behavior on the pilots before continuing.

### 5. Publish to the fleet

1. On the same release row, click **Publish**.
2. That board’s fleet channel now points at this release.
3. Click **Clear overrides** so pilot devices follow the fleet again (or clear overrides per device on the Devices tab).

All other devices of that board type will download the new firmware on their next successful wake, once registered.

## How devices decide to update

On each wake, after Wi‑Fi is up, the device calls `device_wake_sync` once. That returns sensor config, the desired firmware (pilot override if set, otherwise the fleet release), and records the device’s current integer version.

If the remote integer differs from local `FIRMWARE_VERSION` and a download URL is present, the device downloads the `.bin` over HTTPS and reboots into it. Unpaired devices do not update.

## Checklist (copy for each release)

- [ ] Code changes ready
- [ ] `FIRMWARE_VERSION` bumped in `Config.h`
- [ ] Built with Minimal SPIFFS (1.9MB APP with OTA) / 4MB flash
- [ ] Exported `humidity_remote_controlled.ino.bin` for `esp32c5` (if applicable)
- [ ] Exported `humidity_remote_controlled.ino.bin` for `esp32c6` (if applicable)
- [ ] Staged in **Admin → Firmware** (integer + semantic version)
- [ ] Piloted on test devices; reported version matches
- [ ] Published to fleet
- [ ] Pilot overrides cleared
