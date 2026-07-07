'use client';

import dynamic from 'next/dynamic';

// WebGL : client uniquement, pas de rendu serveur.
const Ultimate3D = dynamic(() => import('./Ultimate3D'), {
    ssr: false,
    loading: () => (
        <div className="flex h-screen items-center justify-center bg-[#05100b]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
    ),
});

export default function Ultimate3DPage() {
    return <Ultimate3D />;
}
