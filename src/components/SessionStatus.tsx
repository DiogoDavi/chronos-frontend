// import { useEffect, useState } from 'react';
// import { AlertTriangle, CheckCircle, WifiOff } from 'lucide-react';

// interface SessionStatusProps {
//     theme: 'dark' | 'light';
// }

// type Status = 'active' | 'expired' | 'loading';

// export const SessionStatus = ({ theme }: SessionStatusProps) => {
//     const [status, setStatus] = useState<Status>('loading');
//     const apiUrl = import.meta.env.VITE_API_URL;

//     useEffect(() => {
//         const check = async () => {
//             try {
//                 const res = await fetch(`${apiUrl}/api/session/status`);
//                 const data = await res.json();
//                 setStatus(data.status as Status);
//             } catch {
//                 setStatus('expired');
//             }
//         };
//         check();
//         const interval = setInterval(check, 5 * 60 * 1000);
//         return () => clearInterval(interval);
//     }, []);

//     if (status === 'loading') return null;

//     if (status === 'active') {
//         return (
//             <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
//                 <CheckCircle className="w-3 h-3 text-emerald-500" />
//                 <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
//                     Sync OK
//                 </span>
//             </div>
//         );
//     }

//     return (
//         <div className="flex items-center gap-2">
//             <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 animate-pulse">
//                 <WifiOff className="w-3 h-3 text-red-500" />
//                 <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wider">
//                     Sync Offline
//                 </span>
//             </div>

//             <a
//                 href="https://login.microsoftonline.com/"
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all border ${theme === 'dark'
//                         ? 'bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30'
//                         : 'bg-orange-50 border-orange-300 text-orange-600 hover:bg-orange-100'
//                     }`}
//             >
//                 <AlertTriangle className="w-3 h-3" />
//                 Reconectar
//             </a>
//         </div>
//     );
// };


import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, WifiOff, AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';

interface SessionStatusProps {
  theme: 'dark' | 'light';
}

type Status = 'active' | 'expired' | 'pending' | 'mfa_required' | 'loading';

interface SessionData {
  status: Status;
  mfaCode: string | null;
  mfaMessage: string | null;
}

export const SessionStatus = ({ theme }: SessionStatusProps) => {
  const [session, setSession] = useState<SessionData>({
    status: 'loading',
    mfaCode: null,
    mfaMessage: null
  });
  const [reconnecting, setReconnecting] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/session/status`);
      const data = await res.json();
      setSession({
        status: data.status,
        mfaCode: data.mfaCode || null,
        mfaMessage: data.mfaMessage || null
      });
    } catch {
      setSession(s => ({ ...s, status: 'expired' }));
    }
  }, [apiUrl]);

  // polling: a cada 5min em idle, a cada 3s durante pending/mfa
  useEffect(() => {
    checkStatus();

    const interval = setInterval(() => {
      checkStatus();
    }, ['pending', 'mfa_required'].includes(session.status) ? 3000 : 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session.status]);

  const handleReconectar = async () => {
    setReconnecting(true);
    setSession(s => ({ ...s, status: 'pending' }));

    try {
      await fetch(`${apiUrl}/api/session/reconnect`, { method: 'POST' });
    } catch {
      setSession(s => ({ ...s, status: 'expired' }));
    } finally {
      setReconnecting(false);
    }
  };

  // ── Carregando ──────────────────────────────────────────────
  if (session.status === 'loading') return null;

  // ── Ativo ───────────────────────────────────────────────────
  if (session.status === 'active') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle className="w-3 h-3 text-emerald-500" />
        <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
          Sync OK
        </span>
      </div>
    );
  }

  // ── Pendente (login em andamento) ───────────────────────────
  if (session.status === 'pending') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
        <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
        <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider">
          Conectando...
        </span>
      </div>
    );
  }

  // ── MFA necessário ──────────────────────────────────────────
  if (session.status === 'mfa_required') {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
          theme === 'dark'
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-yellow-50 border-yellow-300'
        }`}>
          <ShieldCheck className="w-3.5 h-3.5 text-yellow-500" />
          <span className="text-[10px] font-semibold text-yellow-600 uppercase tracking-wider">
            Aprove no Authenticator
          </span>
          {session.mfaCode && (
            <span className="ml-1 text-sm font-black text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/30">
              {session.mfaCode}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Expirado ────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 animate-pulse">
        <WifiOff className="w-3 h-3 text-red-500" />
        <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wider">
          Sync Offline
        </span>
      </div>

      <button
        onClick={handleReconectar}
        disabled={reconnecting}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all border ${
          theme === 'dark'
            ? 'bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30'
            : 'bg-orange-50 border-orange-300 text-orange-600 hover:bg-orange-100'
        }`}
      >
        <AlertTriangle className="w-3 h-3" />
        {reconnecting ? 'Iniciando...' : 'Reconectar'}
      </button>
    </div>
  );
};
