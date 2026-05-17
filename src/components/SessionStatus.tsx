import { useEffect, useState, useCallback, useRef } from 'react';
import { CheckCircle, WifiOff, AlertTriangle, Loader2, ShieldCheck, X, Eye, EyeOff } from 'lucide-react';

interface Props { theme: 'dark' | 'light' }

type Status = 'active' | 'expired' | 'pending' | 'mfa_required' | 'loading';

interface SessionData {
    status: Status;
    mfaCode: string | null;
    mfaMessage: string | null;
    lastSync: string | null;
    lastError: string | null;
}

export const SessionStatus = ({ theme }: Props) => {
    const [session, setSession] = useState<SessionData>({
        status: 'loading',
        mfaCode: null,
        mfaMessage: null,
        lastSync: null,
        lastError: null
    });

    const [showModal, setShowModal] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const intervalRef = useRef<any>(null);
    const loginTimestampRef = useRef<number>(0);
    const apiUrl = import.meta.env.VITE_API_URL;

    const checkStatus = useCallback(async () => {
        try {
            const res = await fetch(`${apiUrl}/api/session/status`);
            const data = await res.json();

            // Evita condição de corrida: se clicamos em Conectar nos últimos 30 segundos,
            // ignoramos o status 'expired' vindo do banco porque o Puppeteer ainda está iniciando.
            const isRecentlyConnecting = loginTimestampRef.current !== 0 && (Date.now() - loginTimestampRef.current < 30000);
            
            if (data.status === 'expired' && isRecentlyConnecting) {
                setSession(s => ({ ...s, status: 'pending' }));
                return;
            }

            if (['pending', 'mfa_required', 'active'].includes(data.status)) {
                // O Reader já iniciou e respondeu ou terminou. Podemos liberar a trava de tempo.
                loginTimestampRef.current = 0;
            }

            setSession({
                status: data.status,
                mfaCode: data.mfaCode || null,
                mfaMessage: data.mfaMessage || null,
                lastSync: data.lastSync || null,
                lastError: data.lastError || null
            });
        } catch {
            const isRecentlyConnecting = loginTimestampRef.current !== 0 && (Date.now() - loginTimestampRef.current < 30000);
            if (!isRecentlyConnecting) {
                setSession(s => ({ ...s, status: 'expired' }));
            }
        }
    }, [apiUrl]);

    useEffect(() => {
        checkStatus();

        if (intervalRef.current) clearInterval(intervalRef.current);

        // Se estivermos enviando login ou o status for pendente/mfa, polling rápido (3s)
        const isWaiting = sending || ['pending', 'mfa_required'].includes(session.status);

        intervalRef.current = setInterval(checkStatus, isWaiting ? 3000 : 5 * 60 * 1000);

        return () => clearInterval(intervalRef.current);
    }, [session.status, sending, checkStatus]);

    // Resetar estado de "sending" se o status voltar para expired (erro no backend)
    useEffect(() => {
        if (session.status === 'expired' && sending) {
            setSending(false);
        }
    }, [session.status, sending]);

    useEffect(() => {
        if (session.status === 'active' && showModal) {
            setShowModal(false);
            setSending(false);
        }
    }, [session.status, showModal]);

    // 🔥 SOMENTE AJUSTE FUNCIONAL (ROTA)
    const handleConectar = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (!email || !password) {
            setError('Preencha email e senha');
            return;
        }

        loginTimestampRef.current = Date.now();
        setSending(true);
        setError('');

        try {
            const res = await fetch(
                `${apiUrl}/api/romaneios/reconnect`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || 'Erro ao conectar');
                loginTimestampRef.current = 0;
                setSending(false);
                return;
            }

            // NÃO FECHA O MODAL AQUI IMEDIATAMENTE para evitar flash
            // Limpamos apenas a senha por segurança.
            setPassword('');
            setSession(s => ({ ...s, status: 'pending' }));

        } catch {
            setError('Erro de conexão com o servidor');
            loginTimestampRef.current = 0;
            setSending(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setPassword('');
        setError('');
        setSending(false);
        loginTimestampRef.current = 0;
    };

    // ── Renderização do Status ────────────────────────────────
    let statusContent = null;

    if (session.status === 'loading') {
        return null;
    }

    if (session.status === 'active') {
        statusContent = (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                    Sync OK
                </span>
            </div>
        );
    } else if (session.status === 'pending') {
        statusContent = (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider">
                    Conectando...
                </span>
            </div>
        );
    } else if (session.status === 'mfa_required') {
        statusContent = (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${theme === 'dark'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-yellow-50 border-yellow-300'
                }`}>
                <ShieldCheck className="w-3.5 h-3.5 text-yellow-500" />
                <span className="text-[10px] font-semibold text-yellow-600 uppercase tracking-wider">
                    Aprove no Authenticator
                </span>
    
                {session.mfaCode && (
                    <span className="text-sm font-black text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/30">
                        {session.mfaCode}
                    </span>
                )}
            </div>
        );
    } else {
        // Offline / Expired
        statusContent = (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 animate-pulse">
                    <WifiOff className="w-3 h-3 text-red-500" />
                    <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wider">
                        Sync Offline
                    </span>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all border ${theme === 'dark'
                            ? 'bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30'
                                : 'bg-orange-50 border-orange-300 text-orange-600 hover:bg-orange-100'
                        }`}
                >
                    <AlertTriangle className="w-3 h-3" />
                    Reconectar
                </button>
            </div>
        );
    }

    return (
        <>
            {statusContent}

            {/* MODAL ORIGINAL (COM FIX DE Z-INDEX E FORM) */}
            {showModal && (
                <div 
                    onClick={closeModal}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
                >
                    <form 
                        onSubmit={handleConectar}
                        onClick={(e) => e.stopPropagation()}
                        className={`relative w-full max-w-sm mx-4 rounded-2xl p-6 shadow-2xl border cursor-default ${theme === 'dark'
                            ? 'bg-[#1a1a1e] border-white/10'
                            : 'bg-white border-zinc-200'
                        }`}
                    >

                        {/* Fechar */}
                        <button
                            type="button"
                            onClick={closeModal}
                            className={`absolute top-4 right-4 p-1 rounded-full transition-all ${theme === 'dark'
                                    ? 'text-zinc-400 hover:text-white hover:bg-white/10'
                                    : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
                                }`}
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Cabeçalho */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-blue-500" />
                            </div>

                            <div>
                                <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'
                                    }`}>
                                    Reconexão Microsoft
                                </h3>
                                <p className="text-[11px] text-zinc-500">
                                    Insira suas credenciais para reconectar
                                </p>
                            </div>
                        </div>

                        {/* Formulário */}
                        <div className="space-y-3">
                            <div>
                                <label className={`block text-[11px] font-semibold mb-1.5 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
                                    }`}>
                                    Email Microsoft
                                </label>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="email@empresa.com.br"
                                    autoComplete="email"
                                    className={`w-full px-3 py-2 rounded-lg text-sm border outline-none transition-all ${theme === 'dark'
                                            ? 'bg-white/5 border-white/10 text-white placeholder-zinc-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10'
                                            : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
                                        }`}
                                />
                            </div>

                            <div>
                                <label className={`block text-[11px] font-semibold mb-1.5 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
                                    }`}>
                                    Senha Microsoft
                                </label>

                                <div className="relative">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        className={`w-full px-3 py-2 pr-10 rounded-lg text-sm border outline-none transition-all ${theme === 'dark'
                                                ? 'bg-white/5 border-white/10 text-white placeholder-zinc-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10'
                                                : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
                                            }`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPass(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                    >
                                        {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <p className="text-[11px] text-red-500 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                                    {error}
                                </p>
                            )}

                            <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                                🔒 Suas credenciais não são salvas — usadas apenas para autenticar
                            </p>
                        </div>

                        {/* Botão */}
                        <button
                            type="submit"
                            disabled={sending || !email || !password}
                            className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold transition-all bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {sending
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Conectando...</>
                                : 'Conectar'
                            }
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};