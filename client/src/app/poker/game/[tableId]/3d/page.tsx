'use client';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// WebGL: client-only, no server rendering.
const PokerGame3D = dynamic(() => import('./PokerGame3D'), {
    ssr: false,
    loading: () => (
        <div className="flex h-screen items-center justify-center bg-[#06060F]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
        </div>
    ),
});

export default function PokerGame3DPage() {
    const params = useParams<{ tableId: string }>();
    return <PokerGame3D tableId={params.tableId} />;
}
