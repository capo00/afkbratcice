import { useState, useEffect } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config";

function Progress({ timeMs, onFinish, pause, ...props }) {
  const [ms, setMs] = useState(timeMs);

  useEffect(() => {
    if (!pause) {
      let startMs = new Date().getTime();
      const interval = setInterval(() => {
        startMs += 1000;
        setMs((currMs) => Math.max(currMs - 1000, 0));
      }, 1000);
      return () => {
        clearInterval(interval);
        setMs((currMs) => Math.max(currMs - (new Date().getTime() - startMs), 0));
      };
    }
  }, [timeMs, pause]);

  useEffect(() => {
    const timeout = setTimeout(onFinish, ms);
    return () => clearTimeout(timeout);
  }, [ms, onFinish]);

  const min = Math.floor(ms / Config.minMs);
  const sec = Math.round((ms % Config.minMs) / 1000) % 60;

  return (
    <Uu5Elements.Progress
      value={-Math.round((ms / timeMs) * 100)}
      text={min + ":" + (sec + "").padStart(2, "0")}
      {...props}
    />
  );
}

export default Progress;
