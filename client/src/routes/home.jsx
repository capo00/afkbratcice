import { Lsi } from "uu5g05";
import importLsi from "../lsi/import-lsi";

function Home() {
  return (
    <div>
      <h2>
        <Lsi import={importLsi} path={["home", "header"]} />
      </h2>
    </div>
  );
}

export default Home;
