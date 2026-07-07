'use client';

import dynamic from 'next/dynamic';

// WebGL + capteurs : client uniquement.
const BlackjackVR = dynamic(() => import('./BlackjackVR'), {
    ssr: false,
    loading: () => (
        <div className="flex h-screen items-center justify-center bg-black">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
    ),
});

export default function BlackjackVRPage() {
    return <BlackjackVR />;
}
