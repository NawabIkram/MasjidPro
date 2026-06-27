import { useEffect, useRef, useState } from "react";
import { getGoogleAuthConfig } from "../services/api";

type GoogleCredentialResponse = { credential?: string };
type GoogleButtonText = "continue_with" | "signup_with";

type GoogleIdentityApi = {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (
    element: HTMLElement,
    options: {
      type: "standard";
      theme: "outline";
      size: "large";
      shape: "rectangular";
      text: GoogleButtonText;
      width: number;
    },
  ) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentityApi } };
  }
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript() {
  if (window.google?.accounts.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    const script = existing ?? document.createElement("script");
    const onLoad = () => window.google?.accounts.id ? resolve() : reject(new Error("Google Identity Services did not load."));
    const onError = () => reject(new Error("Google Identity Services could not be loaded."));
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existing) {
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return googleScriptPromise;
}

export function GoogleSignInButton({
  disabled = false,
  onCredential,
  text = "continue_with",
}: {
  disabled?: boolean;
  onCredential: (credential: string) => void;
  text?: GoogleButtonText;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [message, setMessage] = useState("Loading Google Sign-In...");

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getGoogleAuthConfig(), loadGoogleIdentityScript()])
      .then(([config]) => {
        if (cancelled || !hostRef.current) return;
        if (!config.ready || !config.clientId) throw new Error("Google Sign-In is not configured yet.");
        window.google?.accounts.id.initialize({
          client_id: config.clientId,
          callback: (response) => {
            if (response.credential) callbackRef.current(response.credential);
          },
        });
        hostRef.current.replaceChildren();
        const buttonWidth = Math.max(200, Math.min(400, Math.floor(hostRef.current.getBoundingClientRect().width)));
        window.google?.accounts.id.renderButton(hostRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text,
          width: buttonWidth,
        });
        setState("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setMessage(error instanceof Error ? error.message : "Google Sign-In is unavailable.");
        setState("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [text]);

  return (
    <div className={`google-auth ${disabled ? "disabled" : ""}`} aria-busy={state === "loading"}>
      <div className="google-button-host" ref={hostRef} />
      {state !== "ready" ? (
        <button className="secondary-button full" disabled type="button" title={message}>
          {state === "loading" ? "Loading Google..." : "Google Sign-In unavailable"}
        </button>
      ) : null}
    </div>
  );
}
