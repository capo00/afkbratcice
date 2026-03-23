import { useEffect, usePreviousValue, useRef, useUveVisibility } from "uu5g05";

function useReload(getReloadDelay, reload, deps) {
  const uveVisible = useUveVisibility();
  const visible = uveVisible;

  const nextReloadTimeRef = useRef();
  const timeoutRef = useRef();
  const prevVisible = usePreviousValue(visible, visible);

  useEffect(() => {
    if (!visible) return;

    // if visible was changed
    if (prevVisible !== visible && nextReloadTimeRef.current) {
      const diff = nextReloadTimeRef.current - new Date().getTime();
      if (diff < 0) {
        // it should be already reloaded
        nextReloadTimeRef.current = null;
        // console.log("2.2B visible again, reload immediately", getTime(), diff);
        reload?.();
      } else {
        // not reloaded yet, so plan the REST of delay
        nextReloadTimeRef.current = new Date().getTime() + diff;
        // console.log(
        //   "2.1 visible again, plan reload with diff",
        //   getTime(),
        //   "+",
        //   diff,
        //   "=>",
        //   getTime(new Date(nextReloadTimeRef.current)),
        // );

        timeoutRef.current = setTimeout(() => {
          nextReloadTimeRef.current = null;
          // console.log("2.2A reload by plan", getTime());
          reload?.();
        }, diff);
        return () => {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
          // console.log("2.3 clear timeout", getTime());
        };
      }
    } else {
      const delay = getReloadDelay();
      if (!delay) return;

      nextReloadTimeRef.current = new Date().getTime() + delay;

      // console.log("1.1 plan reload", getTime(), "+", delay, "=>", getTime(new Date(nextReloadTimeRef.current)));
      timeoutRef.current = setTimeout(() => {
        nextReloadTimeRef.current = null;
        // console.log("1.2 reload by plan", getTime());
        reload?.();
      }, delay);

      return () => {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        // console.log("1.3 clear timeout", getTime());
      };
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [visible, ...deps]);

  return { visible };
}

export default useReload;
