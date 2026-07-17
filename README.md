# Plantir

A web dashboard to monitor the humidity level of home plants collecting data periodically from Arduino sensors. This project uses [Supabase](https://supabase.com/) as its backend. All the firmware code for the humidity sensors is located under the [arduino](./arduino/) folder, and it can be uploaded on physical devices using the [Arduino IDE](https://www.arduino.cc/en/software/).

## Quick Start

- Ensure to have an account on Supabase and to be able to access the [project dashboard](https://supabase.com/dashboard/project/zlsmzlingdehpgglxpmk).
- Configure your local `.env` file following these steps:
  - Run `cp env.sample .env`
  - Connect to [this link](https://supabase.com/dashboard/project/_?showConnect=true&connectTab=frameworks&framework=react) and select the `plantir` project.
  - Copy-paste in the `.env` file the environment variables.
- Run the application with `npm run dev`.

## Available Commands

The following commands are defined in the `scripts` section of the `package.json` file:

- **`dev`**: Starts the development server using Vite. Run the command `npm run dev`.
- **`build`**: Builds the application for production. Run the command `npm run build`.
- **`lint`**: Runs ESLint to analyze the code and find potential issues. Run the command `npm run lint`.
- **`preview`**: Starts a preview of the production build. Run the command `npm run preview`.

## Deno (Edge Functions)

Edge Functions in this repository run on Deno. You need Deno installed locally to work with them (run unit tests, type-check, etc.).

Install Deno via Homebrew:

```sh
brew install deno
```

Or with the official install script:

```sh
curl -fsSL https://deno.land/install.sh | sh
```

After installation, add the Deno binary to your PATH if prompted (add the two `export` lines to your `~/.zshrc` and run `source ~/.zshrc`). Verify with `deno --version`.

### Running Edge Function unit tests

```sh
cd supabase && deno task test
```

To type-check edge functions without running the tests:

```sh
deno check supabase/functions/garden-achievements/badgeEligibility.ts
```

### VSCode Extension

Install the `denoland.vscode-deno` extension for syntax highlighting, type checking, and IntelliSense inside the `supabase/functions/` directory.

## Arduino IDE

To edit and upload the firmware code for the humidity sensors, it's suggested to use the official Arduino IDE. Follow these steps to setup your development environment:

1. Go to _Arduino IDE_ > _Preferences_ > _Settings_ and change the **Sketchbook location** folder to the [arduino](./arduino/) folder of this repository.

2. Ensure to install in the Arduino IDE the correct driver for the board you are using for your devices (e.g. Nano ESP32). Go to _Tools_ > _Board_ > _Boards Manager_ and type your board name to install the driver.

3. Go to `Sketchbook` in the IDE, select the project you want to work on (e.g `humidity_remote_controlled`), open its `sketch.yaml` file and manually install its dependency from the `Library Manager` of the IDE (just copy-paste each dependency name and click on _INSTALL_).

#### Upload the code

Double click on the board button to switch in "Bootloader" mode (stable green light), then Upload the code from the IDE by clicking _Sketch_ > _Upload_ in the toolbar.

#### Execute the code

Remove the USB cable from your board and then plug it again, the code will run automatically.

## Documentation

[Supabase](./docs/supabase.md) • [Electronics](./docs/electronics.md) • [Roadmap](./docs/roadmap/index.md)
