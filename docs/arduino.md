# Arduino

## Arduino IDE

Follow these steps to setup your Arduino IDE:

1. Go to _Arduino IDE_ > _Preferences_ > _Settings_ and change the **Sketchbook location** folder to the [arduino](../arduino/) folder of this repository.

2. Ensure to install in the Arduino IDE the correct driver for your board (e.g. Nano ESP32). Go to _Tools_ > _Board_ > _Boards Manager_ and type your board name to install the driver.

3. Go to `Sketchbook` in the IDE, select the project you want to work on (e.g `humidity_remote_controlled`), open its `sketch.yaml` file and manually install its dependency from the `Library Manager` of the IDE (just copy-paste each dependency name and click on _INSTALL_).

#### Upload the code

Double click on the board button to switch in "Bootloader" mode (stable green light), then Upload the code from the IDE by clicking _Sketch_ > _Upload_ in the toolbar.

#### Execute the code

Remove the USB cable from your board and then plug it again, the code will run automatically.
