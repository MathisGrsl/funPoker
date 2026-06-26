import { Card } from './cards';

/** Phases du cycle d'une manche. */
export type Phase =
    | 'waiting'      // aucune mise en cours, en attente de joueurs/mises
    | 'betting'      // les joueurs placent leurs mises (avec minuteur)
    | 'dealing'      // distribution initiale
    | 'insurance'    // croupier montre un As : assurance proposée
    | 'playerTurns'  // chaque main joue à son tour
    | 'dealerTurn'   // le croupier joue
    | 'settle';      // résultats + paiements

/** État d'une main jouée sur un siège. */
export type HandStatus =
    | 'playing'
    | 'stand'
    | 'bust'
    | 'blackjack'
    | 'doubled';

export type HandResult = 'win' | 'lose' | 'push' | 'blackjack';

export interface Hand {
    cards: Card[];
    bet: number;
    status: HandStatus;
    /** Vrai pour les mains issues d'un split (interdit le blackjack naturel). */
    fromSplit: boolean;
    /** Mise d'assurance placée (croupier montrant un As). */
    insurance?: number;
    result?: HandResult;
    /** Montant total rendu au joueur (mise incluse) si la main est réglée. */
    payout?: number;
}

export interface Seat {
    index: number;
    playerId: string | null;
    playerName: string | null;
    /** Mise déposée pendant la phase de mise (sert à la prochaine distribution). */
    pendingBet: number;
    /** Mise de la manche précédente (pour le « rebet »). */
    lastBet: number;
    /** Mains de la manche en cours (>1 après un split). */
    hands: Hand[];
}

/* ------------------------------------------------------------------ */
/*  Snapshot public envoyé au client (sérialisable, sans logique)     */
/* ------------------------------------------------------------------ */

/** Une carte face cachée n'expose pas sa valeur. */
export type SnapshotCard = { hidden: true } | (Card & { hidden?: false });

export interface SnapshotHand {
    cards: SnapshotCard[];
    bet: number;
    value: number;
    soft: boolean;
    status: HandStatus;
    insurance?: number;
    result?: HandResult;
    payout?: number;
}

export interface SnapshotSeat {
    index: number;
    playerId: string | null;
    playerName: string | null;
    pendingBet: number;
    lastBet: number;
    hands: SnapshotHand[];
}

export interface SnapshotDealer {
    cards: SnapshotCard[];
    /** Valeur des seules cartes visibles (la carte cachée est exclue). */
    value: number;
    soft: boolean;
}

export interface TableSnapshot {
    tableId: string;
    name: string;
    phase: Phase;
    seats: SnapshotSeat[];
    dealer: SnapshotDealer;
    /** Siège dont c'est le tour (null hors phase de jeu). */
    activeSeat: number | null;
    activeHand: number | null;
    /** Échéance du minuteur courant (epoch ms) pour l'affichage du compte à rebours. */
    deadline: number | null;
    minBet: number;
    maxBet: number;
    /** Soldes VirtualCredit des joueurs assis (par playerId). */
    balances: Record<string, number>;
}

export type PlayerAction = 'hit' | 'stand' | 'double' | 'split';
