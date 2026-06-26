'use client';

/**
 * Inscriptions arquées du tapis : « Blackjack pays 3 to 2 », ruban doré
 * « INSURANCE PAYS 2 TO 1 » et la règle du croupier. SVG contenu (ne
 * chevauche rien) — net à toutes les tailles.
 */
export default function FeltArc({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 760 170" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <path id="bjArc" d="M 150 96 Q 380 40 610 96" />
                <path id="insArc" d="M 175 128 Q 380 86 585 128" />
            </defs>

            {/* « Blackjack pays 3 to 2 » courbé */}
            <text fill="#F4F7FF" style={{ fontSize: 23, fontWeight: 800, letterSpacing: 1.5 }}>
                <textPath href="#bjArc" startOffset="50%" textAnchor="middle">Blackjack pays 3 to 2</textPath>
            </text>

            {/* Ruban doré + INSURANCE */}
            <path d="M 140 132 Q 380 86 620 132" stroke="#9a6c0c" strokeWidth="30" strokeLinecap="round" />
            <path d="M 140 132 Q 380 86 620 132" stroke="#E0B64A" strokeWidth="22" strokeLinecap="round" />
            <text fill="#FFFFFF" stroke="#6b4e08" strokeWidth="0.5" paintOrder="stroke" style={{ fontSize: 15, fontWeight: 800, letterSpacing: 2 }}>
                <textPath href="#insArc" startOffset="50%" textAnchor="middle">INSURANCE · PAYS 2 TO 1</textPath>
            </text>

            {/* Règle du croupier */}
            <text x="380" y="160" textAnchor="middle" fill="#CFE3D8" style={{ fontSize: 13, fontStyle: 'italic' }}>
                Dealer must draw on 16 and stand to 17
            </text>
        </svg>
    );
}
