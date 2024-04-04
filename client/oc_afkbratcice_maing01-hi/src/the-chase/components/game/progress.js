import { useState, useEffect } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config";

function Progress({ timeMs, onFinish, ...props }) {
  const [timeFromMs] = useState(() => new Date().getTime());
  const [ms, setMs] = useState(timeMs);
  const timeToMs = timeFromMs + timeMs;

  useEffect(() => {
    const interval = setInterval(() => {
      setMs(timeMs - (new Date().getTime() - timeFromMs));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeMs, timeFromMs]);

  useEffect(() => {
    const timeout = setTimeout(onFinish, timeToMs - new Date().getTime());
    return () => clearTimeout(timeout);
  }, [timeToMs, onFinish]);

  const min = Math.floor(ms / Config.minMs);
  const sec = Math.round((ms % Config.minMs) / 1000);

  return (
    <Uu5Elements.Progress
      value={-Math.round((ms / timeMs) * 100)}
      text={min + ":" + (sec + "").padStart(2, "0")}
      {...props}
    />
  );
}

export default Progress;
