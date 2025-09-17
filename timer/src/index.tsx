import FuturisticTimerApp from "./FuturisticTimerApp";

declare global {
  interface Window {
    TimerApp?: {
      FuturisticTimerApp: typeof FuturisticTimerApp;
    };
  }
}

export { FuturisticTimerApp };
export default FuturisticTimerApp;

if (typeof window !== "undefined") {
  window.TimerApp = { FuturisticTimerApp };
}
