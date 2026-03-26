# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Available Commands

The following commands are defined in the `scripts` section of the `package.json` file:

- **`dev`**: Starts the development server using Vite. Run the command `npm run dev`.
- **`build`**: Builds the application for production. Run the command `npm run build`.
- **`lint`**: Runs ESLint to analyze the code and find potential issues. Run the command `npm run lint`.
- **`preview`**: Starts a preview of the production build. Run the command `npm run preview`.

## Supabase integration

Supabase is a serverless database built on PostgreSQL, designed to integrate seamlessly with applications via APIs. It provides a RESTful interface and official clients, such as `supabase/supabase-js`, to interact with the database, manage authentication, storage, and other features.

You can access the main Supabase project dashboard at [this link](https://supabase.com/dashboard/project/zlsmzlingdehpgglxpmk).

To configure the environment variables, create a local `.env` file based on the `env.sample` file included in this repository:

```sh
cp env.sample .env
```

To retrieve the values for the required environment variables for Supabase, connect to [this link](https://supabase.com/dashboard/project/_?showConnect=true&connectTab=frameworks&framework=react).

Any modifications to the database schema can be made directly from the Supabase Dashboard. Additionally, bulk imports or exports of data can be performed using CSV files.

As a final note, the frontend app uses the official Supabase client, `supabase/supabase-js`, to connect to the database via API. The following code shows an example of how the client is used to connect to the "plants" table and display the items it contains:

```ts
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

function App() {
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("plants").select();
      setPlants(data);
    })();
  }, []);

  return (
    <ul>
      {plants.map((plant) => (
        <li key={plant.name}>{plant.name}</li>
      ))}
    </ul>
  );
}

export default App;

```
