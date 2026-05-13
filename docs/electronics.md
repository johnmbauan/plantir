# Electronics

Here the list of all tools and components used to create humidity sensors for plants.

## Tools

[Breadboard](#breadboard) • Multimeter • Soldering Iron • Jumper wires

### Breadboard

The solderless breadboard (generally a large, white, plastic component with rows and columns of holes) provides a working space where temporary circuits can easily be built1. Leads of electrical components (e.g. resistors) can easily be pushed into the breadboard holes.

A typical breadboard has a large number of holes which are organized in rows of five or six. The holes in any single row are electrically connected to one another. Any two rows of holes are isolated electrically from one another. A central groove or channel generally separates two banks of these holes.

![Breadboard](https://digilent.com/reference/_media/learn/fundamentals/electronic-components/solderless-breadboard/breadboard_2.png)

Holes in a breadboard which are electrically connected are said to be at the same node in a circuit. A node is a point in a circuit where two or more components are interconnected by a short circuit. No energy is required to transfer current through a short circuit, so the short circuit does not restrict the flow of current—it has zero resistance. This means that there can be (theoretically) no voltage difference between two holes in any single row in a breadboard.
No current will flow from one hole to another on a breadboard if the holes are not electrically connected. Different physical points in a circuit which are not electrically connected are sometimes said to be connected by an open circuit. No current can flow through an open circuit. There is no limit to the possible voltage difference across an open circuit.

![Bus strips](https://digilent.com/reference/_media/learn/fundamentals/electronic-components/solderless-breadboard/breadboard_3.png)

Some breadboards have, in addition to the hole layout supplementary rows of holes running the entire length of the breadboard. These rows are called bus strips. Bus strips are mostly useful when connecting the same voltage level at multiple locations in larger-scale circuits. Ground and fixed voltage supplies, for example, may be used in multiple stages in an overall circuit. Bus strips are often marked with a red or blue line running next to them.

## Components

[Board](#board) • Humidity Sensor • Charge-Boost module • Battery

### Board

The project uses the Arduino `Nano ESP32` board, a compact development board based on the u-blox NORA-W106-10B module, which contains an ESP32-S3 processor. It is the first Arduino board fully based on an ESP32 chip as its main processor.

#### Processor and memory

At its core is a Xtensa LX7 dual-core 32-bit microprocessor, running at up to 240 MHz. It has 384 kB of ROM, 512 kB of SRAM, 8 MB of PSRAM, and 16 MB of external flash memory. In deep sleep it draws approximately 7 μA (chip only, not counting LEDs and other onboard components).

#### Connectivity

It supports WiFi 802.11 b/g/n (up to 150 Mbps, maximum range approximately 500 meters) and Bluetooth Low Energy 5.0 (up to 2 Mbps), both through a built-in 2.4 GHz antenna.
Power
The board operates at 3.3V. It can be powered in two ways: through the USB-C port (4.8-5.5V) or through the VIN pin (6-21V). In both cases, the onboard MP2322GQH voltage regulator steps everything down to 3.3V. There is no dedicated 5V pin: the only way to get 5V from the board is through the VBUS pin, which only works when USB-C is connected.
![nano esp32](https://futuranet.it/wp-content/uploads/2025/05/PINOUT-Arduino-nano-ESP32.jpg)

#### Power

The board operates at 3.3V. It can be powered in two ways: through the USB-C port (4.8-5.5V) or through the VIN pin (6-21V). In both cases, the onboard MP2322GQH voltage regulator steps everything down to 3.3V. There is no dedicated 5V pin: the only way to get 5V from the board is through the VBUS pin, which only works when USB-C is connected.

#### Pins: analog side

Looking at the board with USB-C facing up, the left side has 15 pins:

- `D13/SCK`: serial clock for SPI communication
- `3V3`: 3.3V output from the regulator — used to power external sensors and components that run at 3.3V
- `BOOT0`: used for board reset, normally left untouched
- `A0 through A7 (8 pins)`: analog inputs. They read voltages from 0 to 3.3V and convert them into a numerical value (0 to 4095 at 12-bit resolution). Used for reading sensors that output a variable signal, such as temperature sensors, potentiometers, photoresistors, or — in our case — battery voltage through a voltage divider. A4 and A5 also have a special function: they are the default pins for I2C communication (A4 = SDA for data, A5 = SCL for clock), used to connect displays, advanced sensors, and other devices
- `VBUS`: provides 5V but only when the board is powered via USB-C
- `BOOT1`: like BOOT0, used for reset
- `GND`: ground, the negative pole of the circuit. All external components must have their negative terminal connected here
- `VIN`: input for external power from 6V to 21V.

#### Pins: digital side

The right side has another 15 pins:

- `D12/CIPO, D11/COPI, D10/CS`: the three pins for SPI communication, used to connect displays, SD card readers, and high-speed sensors. CIPO receives data, COPI sends data, CS selects the device
- `D2 through D9 (8 pins)`: general-purpose digital pins. They can be configured as input (reading HIGH or LOW, i.e. "on or off") or as output (sending HIGH or LOW). Used for turning on LEDs, reading buttons, controlling relays, and they can generate PWM signals to control LED brightness or motor speed. Every pin also supports interrupts, meaning it can notify the processor immediately when its state changes, without the need for constant polling
- `GND`: a second ground, identical to the one on the other side
- `RST`: reset pin — briefly connecting it to GND reboots the board
- `D0/RX and D1/TX`: pins for UART serial communication. RX receives data, TX transmits data. Used for communicating with GPS modules, serial sensors, or other microcontrollers.

#### Humidity sensor

Connections with the Board:

- GND (Board) -> GND (Sensor - black cable)
- 3.3V (Board) -> VCC (Sensor - red cable)
- A0 (Board) -> AOUT (Sensor - yellow cable)

### Case


## Using [DIYMore ESP32 board](https://www.amazon.it/dp/B0CJNMRG37?ref_=ppx_hzsearch_conn_dt_b_fed_asin_title_1&th=1)  with Arduino IDE
- Open the Arduino IDE
- Install the "esp32 by Espressif" board drivers, if you haven't already
- Connect the board
- In the "Select Other Board and Port" modal that appears when selecting the board, select "WEMOS D1 MINI"; then select the correct port where you've connected the board; hit the "OK" button.
- Under "Tools -> Upload Speed", select 460800
- Under "Serial Monitor" tab, select the correct "Baud" (whatever you set in the sketch, like `Serial.begin(115200);`; `115200` is the baud you have to choose)

### Connecting [DIYMore ESP32 board](https://www.amazon.it/dp/B0CJNMRG37?ref_=ppx_hzsearch_conn_dt_b_fed_asin_title_1&th=1) to the humidity sensor.
- You can see the name of the pins on the back side of the sensor
- Connect the `VCC` pin of the sensor to the 3.3V pin of the board
- Connect the GND of the sensor to the GND of the board
- Connect the AOUT pin of the sensor to the SVP pin (corresponds to pin n. 36 in the sketch: `analogRead(36)`)
- To put the board in boot mode (so it can pick up new sketches), press the BOOT button and then then RST button.

## Using [FireBeetle 2 ESP32-C5](https://www.dfrobot.com/product-2771.html) with Arduino IDE

### Installing drivers

1. Open the Arduino IDE
2. Go to **Tools → Board → Boards Manager**, search for `esp32 by Espressif Systems` and install it (version 3.x or later is required for C5 support)
3. Connect the board via USB-C
4. Go to **Tools → Board → esp32** and select `ESP32C5 Dev Module`
5. Select the correct port under **Tools → Port**

### Required board settings

- **Tools → USB CDC On Boot**: `Enabled` — **critical**. The FireBeetle 2 ESP32-C5 uses the chip's built-in USB (not a separate USB-to-serial chip). Without this, `Serial` maps to UART0 and nothing appears in the Serial Monitor
- **Tools → PSRAM**: `Disabled` (default) — the FireBeetle 2 ESP32-C5 has no PSRAM; this should already be disabled
- **Tools → Flash Mode**: `QIO` — required for the C5; using DIO causes a checksum failure at boot (`Checksum failure. Calculated 0xa0 stored 0xff`) and the sketch won't run
- **Tools → Upload Speed**: `460800`
- **Tools → Flash Size**: `4MB`

### Serial Monitor

- Set the baud rate to match the sketch (e.g. `115200` if the sketch uses `Serial.begin(115200)`)
- Open the Serial Monitor **before** pressing RST, otherwise you'll miss the early boot logs since the board boots quickly

### Known harmless warnings

These messages appear in the Serial Monitor on every boot and can be safely ignored:

- `MSPI Timing: Failed to allocate dummy cacheline for PSRAM memory barrier!` — the ROM bootloader runs MSPI timing calibration and prints this because there is no PSRAM; it does not affect execution
- `SPI mode:DIO` — printed by the first-stage ROM bootloader and does not reflect the actual flash mode used by the application
- `wifi:CCMP mgmt frame from XX:XX:XX:XX:XX:XX used non-zero reserved bit` — emitted by the router, not the chip; it is a minor RFC violation common in consumer routers and does not cause connection failures

### Pin notes

#### 3V3_C
The `3V3_C` pin is a "controllable 3.3V output", for use cases optimized battery consumption is needed. Hence, it needs to be turned on and off explicitly.
```
digitalWrite(powerPin, HIGH);
....
digitalWrite(powerPin, LOW);
```
