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
