import { useEffect, useRef, useState } from "react";
import { getGoogleAuthConfig } from "../services/api";

type GoogleCredentialResponse = { credential?: string };
type GoogleButtonText = "continue_with" | "signup_with";

type GoogleIdentityApi = {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select: false;
    button_auto_select: false;
    context: "signin" | "signup";
    use_fedcm_for_button: true;
    ux_mode: "popup";
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
      click_listener: () => void;
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
    const onError = () => {
      script.remove();
      reject(new Error("Google Identity Services could not be loaded."));
    };
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existing) {
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    googleScriptPromise = null;
    throw error;
  });
  return googleScriptPromise;
}

export function GoogleSignInButton({
  disabled = false,
  onCredential,
  onStart,
  text = "continue_with",
}: {
  disabled?: boolean;
  onCredential: (credential: string) => void;
  onStart?: () => void;
  text?: GoogleButtonText;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const startRef = useRef(onStart);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [message, setMessage] = useState("Loading Google Sign-In...");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    callbackRef.current = onCredential;
    startRef.current = onStart;
  }, [onCredential, onStart]);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setMessage("Loading Google Sign-In...");
    Promise.all([getGoogleAuthConfig(), loadGoogleIdentityScript()])
      .then(([config]) => {
        if (cancelled || !hostRef.current) return;
        if (!config.ready || !config.clientId) throw new Error("Google Sign-In is not configured yet.");
        const googleIdentity = window.google?.accounts.id;
        if (!googleIdentity) throw new Error("Google Identity Services did not load.");
        googleIdentity.initialize({
          client_id: config.clientId,
          auto_select: false,
          button_auto_select: false,
          context: text === "signup_with" ? "signup" : "signin",
          use_fedcm_for_button: true,
          ux_mode: "popup",
          callback: (response) => {
            if (response.credential) {
              callbackRef.current(response.credential);
              return;
            }
            setMessage("Google did not return a sign-in credential. Please try again.");
            setState("unavailable");
          },
        });
        hostRef.current.replaceChildren();
        const buttonWidth = Math.max(200, Math.min(400, Math.floor(hostRef.current.getBoundingClientRect().width)));
        googleIdentity.renderButton(hostRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text,
          width: buttonWidth,
          click_listener: () => startRef.current?.(),
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
  }, [retryKey, text]);

  return (
    <div className={`google-auth ${disabled ? "disabled" : ""}`} aria-busy={state === "loading"}>
      <div className="google-button-host" ref={hostRef} />
      {state !== "ready" ? (
        <button
          className="secondary-button full"
          disabled={state === "loading"}
          type="button"
          title={message}
          onClick={() => setRetryKey((value) => value + 1)}
        >
          {state === "loading" ? "Loading Google..." : "Retry Google Sign-In"}
        </button>
      ) : null}
      {state === "unavailable" ? <p className="google-auth-message" role="alert">{message}</p> : null}
    </div>
  );
}
