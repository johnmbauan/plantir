# Plantir

A web dashboard to monitor the humidity level of home plants collecting data periodically from Arduino sensors. This project uses [Supabase](https://supabase.com/) as its backend. All the firmware code for the humidity sensors is located under the [arduino](./arduino/) folder. Use the [Arduino IDE](https://www.arduino.cc/en/software/) to edit and upload it on physical devices.

## Quick Start

- Ensure to have an account on Supabase and to be able to access the [project dashboard](https://supabase.com/dashboard/project/zlsmzlingdehpgglxpmk).
- Configure your local `.env` file following these steps:
  - Run `cp env.sample .env`
  - Connect to [this link](https://supabase.com/dashboard/project/_?showConnect=true&connectTab=frameworks&framework=react) and select the `plantir` project.
  - Copy-paste in the `.env` file the environment variables.
- Run the application with `npm run dev`.

## VSCode Extensions

Edge Functions developed in JS and deployed on Supabase require Deno to work, thus you need to install the following VSCode extension: `denoland.vscode-deno`.

## Available Commands

The following commands are defined in the `scripts` section of the `package.json` file:

- **`dev`**: Starts the development server using Vite. Run the command `npm run dev`.
- **`build`**: Builds the application for production. Run the command `npm run build`.
- **`lint`**: Runs ESLint to analyze the code and find potential issues. Run the command `npm run lint`.
- **`preview`**: Starts a preview of the production build. Run the command `npm run preview`.

## Technical Documentation

[Supabase](./docs/supabase.md) • [Arduino](./docs/arduino.md) • [Electronics](./docs/electronics.md)

## Roadmap

[Plan Center plan](./docs/roadmap/plant-center-plan.md)
