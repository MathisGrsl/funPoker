'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SERVER_URL } from '@/globalVariables';

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const inputClass =
    'w-full bg-[#161628] border border-[#252540] rounded-xl px-4 py-3 text-[#E2E2F0] text-sm placeholder-[#4A4A6A] outline-none transition-all duration-200 focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]';

const labelClass = 'text-sm font-medium text-[#C4B5FD]';

const googleBtnClass =
    'w-full flex items-center justify-center gap-3 bg-[#161628] hover:bg-[#1E1E35] border border-[#252540] hover:border-[#7C3AED]/40 text-[#E2E2F0] text-sm font-medium py-3 rounded-xl transition-all duration-200 cursor-pointer mb-5';

function PasswordInput({ value, onChange, placeholder = '••••••••' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required
                className={`${inputClass} pr-12`}
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4A4A6A] hover:text-[#9494B8] transition-colors duration-150" tabIndex={-1}>
                {show ? <EyeOffIcon /> : <EyeIcon />}
            </button>
        </div>
    );
}

function SignIn({ onSwitch }: { onSwitch: () => void }) {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${SERVER_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password, rememberMe }),
            });
            const data = await res.json();
            if (!res.ok) return setError(data.error ?? 'Login failed');
            router.push('/lobby');
        } catch {
            setError('Could not reach the server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                        <label className={labelClass}>Password</label>
                        <a href="#" className="text-xs text-[#9F67FF] hover:text-[#C4B5FD] transition-colors duration-150">Forgot password?</a>
                    </div>
                    <PasswordInput value={password} onChange={setPassword} />
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative">
                        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="sr-only" />
                        <div className={`w-4 h-4 rounded border transition-all duration-200 flex items-center justify-center ${rememberMe ? 'bg-[#7C3AED] border-[#7C3AED]' : 'bg-[#161628] border-[#252540] group-hover:border-[#7C3AED]/50'}`}>
                            {rememberMe && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                    </div>
                    <span className="text-sm text-[#9494B8] group-hover:text-[#C4B5FD] transition-colors duration-150">Remember me</span>
                </label>
                {error && <p className="text-sm text-red-400 -mt-1">{error}</p>}
                <button type="submit" disabled={loading} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] disabled:opacity-50 text-white font-semibold text-sm py-3 rounded-xl transition-all duration-200 shadow-[0_4px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_4px_28px_rgba(124,58,237,0.5)] mt-1 cursor-pointer">
                    {loading ? 'Signing in…' : 'Sign in'}
                </button>
            </form>
            <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-[#252540]" />
                <span className="text-xs text-[#4A4A6A]">or</span>
                <div className="flex-1 h-px bg-[#252540]" />
            </div>
            <a href={`${SERVER_URL}/api/auth/google`} className={googleBtnClass}>
                <GoogleIcon />
                Continue with Google
            </a>
            <p className="text-center text-sm text-[#9494B8]">
                No account yet?{' '}
                <button onClick={onSwitch} className="text-[#9F67FF] hover:text-[#C4B5FD] font-medium transition-colors duration-150 cursor-pointer">Sign up</button>
            </p>
        </>
    );
}

function SignUp({ onSwitch }: { onSwitch: () => void }) {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) return setError('Passwords do not match');
        if (password.length < 8) return setError('Password must be at least 8 characters');
        setLoading(true);
        try {
            const res = await fetch(`${SERVER_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, email, password }),
            });
            const data = await res.json();
            if (!res.ok) return setError(data.error ?? 'Registration failed');
            router.push('/lobby');
        } catch {
            setError('Could not reach the server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Username</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="pokerpro42" required className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Password</label>
                    <PasswordInput value={password} onChange={setPassword} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Confirm password</label>
                    <PasswordInput value={confirmPassword} onChange={setConfirmPassword} />
                </div>
                {error && <p className="text-sm text-red-400 -mt-1">{error}</p>}
                <button type="submit" disabled={loading} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] disabled:opacity-50 text-white font-semibold text-sm py-3 rounded-xl transition-all duration-200 shadow-[0_4px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_4px_28px_rgba(124,58,237,0.5)] mt-1 cursor-pointer">
                    {loading ? 'Creating…' : 'Create account'}
                </button>
            </form>
            <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-[#252540]" />
                <span className="text-xs text-[#4A4A6A]">or</span>
                <div className="flex-1 h-px bg-[#252540]" />
            </div>
            <a href={`${SERVER_URL}/api/auth/google`} className={googleBtnClass}>
                <GoogleIcon />
                Sign up with Google
            </a>
            <p className="text-center text-sm text-[#9494B8]">
                Already have an account?{' '}
                <button onClick={onSwitch} className="text-[#9F67FF] hover:text-[#C4B5FD] font-medium transition-colors duration-150 cursor-pointer">Sign in</button>
            </p>
        </>
    );
}

export default function Login() {
    const router = useRouter();
    const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');

    useEffect(() => {
        fetch(`${SERVER_URL}/api/auth/me`, { credentials: 'include' })
            .then((res) => { if (res.ok) router.push('/lobby'); })
            .catch(() => {});
    }, [router]);

    return (
        <main className="min-h-screen bg-[#090910] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#7C3AED] opacity-[0.05] blur-[140px]" />
                <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-[#6D28D9] opacity-[0.04] blur-[100px]" />
            </div>
            <div className="relative w-full max-w-[420px]">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#7C3AED] shadow-[0_0_40px_rgba(124,58,237,0.4)] mb-5">
                        <span className="text-white text-3xl leading-none select-none">♠</span>
                    </div>
                    <h1 className="text-[28px] font-bold text-[#E2E2F0] tracking-tight">funPoker</h1>
                    <p className="text-[#9494B8] text-sm mt-1">
                        {mode === 'signIn' ? 'Sign in to play' : 'Create your account'}
                    </p>
                </div>
                <div className="bg-[#0F0F1C] border border-[#252540] rounded-2xl p-8 shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
                    {mode === 'signIn'
                        ? <SignIn onSwitch={() => setMode('signUp')} />
                        : <SignUp onSwitch={() => setMode('signIn')} />
                    }
                </div>
                <p className="text-center text-xs text-[#4A4A6A] mt-6">
                    By playing, you agree to our{' '}
                    <a href="#" className="hover:text-[#9494B8] transition-colors duration-150">terms of use</a>
                </p>
            </div>
        </main>
    );
}
