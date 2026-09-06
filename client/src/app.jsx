import { Lsi } from "uu5g05";
import importLsi from "./lsi/import-lsi";

function App() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>
        <Lsi import={importLsi} path={["app", "header"]} />
      </h1>
      <p>
        <Lsi import={importLsi} path={["app", "info"]} />
      </p>
    </div>
  );
}

export default App;
