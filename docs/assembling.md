# Assembling all the components

This guide provides detailed, step-by-step instructions for assembling all the components needed to build your Plantir sensor device.

## Step 1: Hardware Connection
Connect the humidity sensor to the ESP32 board. Please follow the specific instructions for your device, as the wiring depends entirely on the hardware components you are using.

## Step 2: Firmware Upload
Upload the Arduino sketch to the ESP32 board. Pay close attention during this step: make sure to read the README file located inside the Plantir repository for notes and guidance on how to properly use the specific ESP32 model you are currently deploying.

## Step 3: Portal Registration
Register the device on the Plantir portal under the **Plants Center** section. For the Device ID, use the unique identifier that is printed in the Arduino IDE serial logs when the sketch runs after the upload of the sketch itself.

## Step 4: Wi-Fi and Supabase Configuration
The ESP32 sketch is programmed to spin up a temporary Wi-Fi network upon initialization. Connect to this temporary network and input the required configuration details:
- The SSID and password of the actual Wi-Fi network the ESP32 should connect to.
- The Supabase URL and API Key (these credentials can be found either in the Plantir repository README or within its local environment file).

## Step 5: Sensor Calibration
Calibrate the humidity sensor by restarting the ESP32 so it performs an execution cycle. Look at the logs to read the raw data:
- **Air Value**: Leave the sensor out in the air without touching it. Note the reading from the Arduino IDE logs, enter it as the "air value" in the device settings on the Plantir portal.
- **Water Value**: Restart the device again, this time with the sensor immersed in water up to where it is allowed to be immersed. Note the reading from the logs, enter it as the "water value" in the portal, and save your settings.
- **Reading frequency**: Set the appropriate reading frequency according to the needs of the plant (a suggested value is between 8 and 24 hours).

> **⚠️ Warning:**
> The air value and water value **should be very different** (as an example, you might see values like ~2500 for air and ~880 for water).
> If these two readings are **the same or their difference is less than 100**, there is likely a problem with the sensor, the wiring, or how the sensor is connected to the ESP32 board. Double-check the sensor's connections and make sure it is functioning properly before proceeding.


## Step 6: Power Connection
Connect the battery to the ESP32 board. Depending on your battery pack and your specific ESP32 model, you may need to check the polarity. For example, if you are using the ESP FireBeetle, which comes with a JST PH 2.0 battery connector, and your rechargeable battery also has a male JST PH 2.0 connector, you might need to cut the battery wires and invert them to match the correct polarity of the board's female connector.

## Step 7: Final Assembly
Place all the connected electronics and components into the case, mount everything securely, and close it up.
The setup is now complete!
