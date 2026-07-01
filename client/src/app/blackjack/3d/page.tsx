'use client';

import dynamic from 'next/dynamic';

// WebGL : chargé uniquement côté client (pas de rendu serveur).
const Blackjack3D = dynamic(() => import('./Blackjack3D'), {
    ssr: false,
    loading: () => (
        <div className="flex h-screen items-center justify-center bg-[#05100b]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
    ),
});

export default function Blackjack3DPage() {
    return <Blackjack3D />;
}
