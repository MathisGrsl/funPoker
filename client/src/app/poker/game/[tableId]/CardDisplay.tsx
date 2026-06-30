'use client';

const SUIT_COLOR: Record<string, string> = {
    h: 'text-red-500',
    d: 'text-red-500',
    c: 'text-slate-800',
    s: 'text-slate-800',
};

const SUIT_SYMBOL: Record<string, string> = {
    h: '♥',
    d: '♦',
    c: '♣',
    s: '♠',
};

type Size = 'sm' | 'md' | 'lg';

type Props = { card: string; size?: Size };

const SIZE = {
    sm: { outer: 'w-9 h-[52px]', rank: 'text-[9px]', suit: 'text-base', inner: 'p-[2px]' },
    md: { outer: 'w-12 h-[70px]', rank: 'text-xs', suit: 'text-xl', inner: 'p-0.5' },
    lg: { outer: 'w-16 h-[94px]', rank: 'text-sm', suit: 'text-3xl', inner: 'p-1' },
};

export default function CardDisplay({ card, size = 'md' }: Props) {
    const s = SIZE[size];

    if (card === 'back') {
        return (
            <div className={`${s.outer} rounded-lg bg-gradient-to-br from-[#1a1060] to-[#0d0840] border-2 border-[#2a1fa0] shadow-lg flex items-center justify-center overflow-hidden`}>
                <div className="w-[70%] h-[80%] rounded border border-[#3a2fc0]/60 flex items-center justify-center">
                    <span className="text-[#3a2fc0] text-lg leading-none select-none">♠</span>
                </div>
            </div>
        );
    }

    const rank = card.slice(0, -1);
    const suit = card.slice(-1);
    const displayRank = rank === 'T' ? '10' : rank;
    const color = SUIT_COLOR[suit] ?? 'text-slate-800';
    const symbol = SUIT_SYMBOL[suit] ?? suit;

    return (
        <div className={`${s.outer} ${s.inner} rounded-lg bg-white border border-gray-200 shadow-lg flex flex-col items-stretch justify-between select-none`}>
            <div className={`flex flex-col items-start leading-none ${color}`}>
                <span className={`${s.rank} font-black leading-none`}>{displayRank}</span>
                <span className={`text-[8px] leading-none font-bold -mt-0.5`}>{symbol}</span>
            </div>
            <div className={`${s.suit} ${color} text-center leading-none font-bold`}>{symbol}</div>
            <div className={`flex flex-col items-end leading-none ${color} rotate-180`}>
                <span className={`${s.rank} font-black leading-none`}>{displayRank}</span>
                <span className={`text-[8px] leading-none font-bold -mt-0.5`}>{symbol}</span>
            </div>
        </div>
    );
}
