'use client';

import { useState } from 'react';

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

const inputClass =
    'w-full bg-[#161628] border border-[#252540] rounded-xl px-4 py-3 text-[#E2E2F0] text-sm placeholder-[#4A4A6A] outline-none transition-all duration-200 focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]';

const labelClass = 'text-sm font-medium text-[#C4B5FD]';

function PasswordInput({
    value,
    onChange,
    placeholder = '••••••••',
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
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
            <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4A4A6A] hover:text-[#9494B8] transition-colors duration-150"
                tabIndex={-1}
            >
                {show ? <EyeOffIcon /> : <EyeIcon />}
            </button>
        </div>
    );
}

function SignIn({ onSwitch }: { onSwitch: () => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    return (
        <>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className={inputClass}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                        <label className={labelClass}>Password</label>
                        <a href="#" className="text-xs text-[#9F67FF] hover:text-[#C4B5FD] transition-colors duration-150">
                            Forgot password?
                        </a>
                    </div>
                    <PasswordInput value={password} onChange={setPassword} />
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border transition-all duration-200 flex items-center justify-center ${rememberMe ? 'bg-[#7C3AED] border-[#7C3AED]' : 'bg-[#161628] border-[#252540] group-hover:border-[#7C3AED]/50'}`}>
                            {rememberMe && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                    </div>
                    <span className="text-sm text-[#9494B8] group-hover:text-[#C4B5FD] transition-colors duration-150">
                        Remember me
                    </span>
                </label>
                <button type="submit" className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white font-semibold text-sm py-3 rounded-xl transition-all duration-200 shadow-[0_4px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_4px_28px_rgba(124,58,237,0.5)] mt-1 cursor-pointer">
                    Sign in
                </button>
            </form>
            <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-[#252540]" />
                <span className="text-xs text-[#4A4A6A]">or</span>
                <div className="flex-1 h-px bg-[#252540]" />
            </div>
            <p className="text-center text-sm text-[#9494B8]">
                No account yet?{' '}
                <button onClick={onSwitch} className="text-[#9F67FF] hover:text-[#C4B5FD] font-medium transition-colors duration-150 cursor-pointer">
                    Sign up
                </button>
            </p>
        </>
    );
}

function SignUp({ onSwitch }: { onSwitch: () => void }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    return (
        <>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="pokerpro42"
                        required
                        className={inputClass}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className={inputClass}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Password</label>
                    <PasswordInput value={password} onChange={setPassword} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Confirm password</label>
                    <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" />
                </div>
                <button type="submit" className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white font-semibold text-sm py-3 rounded-xl transition-all duration-200 shadow-[0_4px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_4px_28px_rgba(124,58,237,0.5)] mt-1 cursor-pointer">
                    Create account
                </button>
            </form>
            <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-[#252540]" />
                <span className="text-xs text-[#4A4A6A]">or</span>
                <div className="flex-1 h-px bg-[#252540]" />
            </div>
            <p className="text-center text-sm text-[#9494B8]">
                Already have an account?{' '}
                <button onClick={onSwitch} className="text-[#9F67FF] hover:text-[#C4B5FD] font-medium transition-colors duration-150 cursor-pointer">
                    Sign in
                </button>
            </p>
        </>
    );
}

export default function Login() {
    const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');

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
                    <a href="#" className="hover:text-[#9494B8] transition-colors duration-150">
                        terms of use
                    </a>
                </p>
            </div>
        </main>
    );
}
