import { useEffect, useRef, useState } from 'react';

const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number;
              logo_alignment?: 'left' | 'center';
            },
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${GOOGLE_SCRIPT}"]`,
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Google Sign-In')),
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(script);
  });
}

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => void | Promise<void>;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  disabled?: boolean;
}

export function GoogleSignInButton({
  onCredential,
  text = 'continue_with',
  disabled = false,
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  callbackRef.current = onCredential;

  useEffect(() => {
    if (!clientId?.trim()) {
      setError('');
      return;
    }

    let cancelled = false;

    async function setup() {
      try {
        await loadGoogleScript();
        if (cancelled || !buttonRef.current || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: clientId!,
          callback: (response) => {
            void callbackRef.current(response.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          width: 320,
          logo_alignment: 'left',
        });
        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Google Sign-In is unavailable',
          );
        }
      }
    }

    void setup();
    return () => {
      cancelled = true;
    };
  }, [clientId, text]);

  if (!clientId?.trim()) {
    return null;
  }

  return (
    <div className={`auth-google${disabled ? ' is-disabled' : ''}`}>
      {error && <div className="auth-error">{error}</div>}
      <div ref={buttonRef} aria-hidden={!ready} />
    </div>
  );
}
