import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import PlantCenter from "@/pages/PlantCenter";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="plants-center" element={<PlantCenter />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
