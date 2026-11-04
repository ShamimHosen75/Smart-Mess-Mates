import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent scroll-wheel from accidentally changing focused number inputs.
document.addEventListener(
  "wheel",
  (e) => {
    const el = document.activeElement as HTMLElement | null;
    if (el && el.tagName === "INPUT" && (el as HTMLInputElement).type === "number") {
      (el as HTMLInputElement).blur();
    }
  },
  { passive: true },
);

// Ensure the deployed app never runs from a stale service-worker cache:
// check for a new worker on load, every minute, and whenever the tab is
// revisited — then take it immediately and reload once.
if ("serviceWorker" in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  const watchRegistration = (reg: ServiceWorkerRegistration) => {
    // A worker is already waiting (common when the app was open during deploy)
    if (reg.waiting && navigator.serviceWorker.controller) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    reg.addEventListener("updatefound", () => {
      const sw = reg.installing;
      sw?.addEventListener("statechange", () => {
        if (sw.state === "installed" && navigator.serviceWorker.controller) {
          sw.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });
  };

  const checkForUpdates = () => {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => {
        watchRegistration(reg);
        reg.update().catch(() => {});
      });
    });
  };

  checkForUpdates();
  setInterval(checkForUpdates, 60_000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkForUpdates();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
