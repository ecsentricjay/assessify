'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Download, Share, PlusSquare, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'assessify-install-dismissed-at';
const DISMISS_DAYS = 7;
const SHOW_AFTER_MS = 4000;

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return at > 0 && Date.now() - at < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

/** Registers the service worker and invites visitors to install the app (Android/Chrome prompt, iOS instructions). */
export function PwaInstall() {
  const pathname = usePathname();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHelp, setIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone || recentlyDismissed()) return;

    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios|edgios/i.test(ua); // only Safari can install on iOS
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    if (isIos) {
      setIosHelp(true);
      timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  }

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      setDeferred(null);
      if (outcome === 'accepted') setVisible(false);
      else dismiss();
    } else if (iosHelp) {
      setShowSteps(true);
    }
  }

  // Never interrupt someone who is sitting a test
  const inExam = /\/practice\/session\//.test(pathname) || pathname.startsWith('/tests/');
  if (!visible || inExam || (!deferred && !iosHelp)) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm sm:p-0" role="dialog" aria-label="Install Assessify">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900">Install Assessify</p>
            <p className="text-sm text-slate-600">Practise JAMB CBT in one tap from your home screen. Free, fast and no app store needed.</p>
          </div>
          <button onClick={dismiss} aria-label="Not now" className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {showSteps ? (
          <ol className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <li className="flex items-center gap-2">
              1. Tap the <Share className="h-4 w-4 text-blue-600" /> <b>Share</b> button in Safari
            </li>
            <li className="flex items-center gap-2">
              2. Choose <PlusSquare className="h-4 w-4 text-blue-600" /> <b>Add to Home Screen</b>
            </li>
            <li>3. Tap <b>Add</b></li>
          </ol>
        ) : (
          <div className="mt-3 flex gap-2">
            <button onClick={install} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1565F5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0F4FCC]">
              <Download className="h-4 w-4" /> Install app
            </button>
            <button onClick={dismiss} className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
