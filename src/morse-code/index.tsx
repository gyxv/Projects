import MorseTelegraph_V5 from "./MorseTelegraph_V5";

declare global {
  interface Window {
    MorseCodeApp?: typeof MorseTelegraph_V5;
    mountReactApp?: (Component: any, container: Element, props?: Record<string, unknown>) => unknown;
  }
}

function autoMount() {
  const container = document.getElementById("morse-code-root");
  if (container && window.mountReactApp) {
    window.mountReactApp(MorseTelegraph_V5, container);
  }
}

if (typeof window !== "undefined") {
  window.MorseCodeApp = MorseTelegraph_V5;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoMount, { once: true });
  } else {
    autoMount();
  }
}

export default MorseTelegraph_V5;
