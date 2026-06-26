import { Card, buildShoe, handValue, isBlackjack } from './cards';
import {
    Hand,
    Phase,
    PlayerAction,
    Seat,
    SnapshotCard,
    TableSnapshot,
} from './types';

/** Hooks injectés : le moteur ne connaît ni socket.io ni la base de données. */
export interface TableHooks {
    broadcast(table: BlackjackTable): void;
    getBalance(playerId: string): number;
    /** delta > 0 crédite, delta < 0 débite. */
    adjustBalance(playerId: string, delta: number): void;
    onRoundSettled(table: BlackjackTable): void;
}

export interface TableConfig {
    decks: number;
    seats: number;
    minBet: number;
    maxBet: number;
    /** Le croupier reste sur tout 17 (soft 17 inclus). */
    dealerStandsSoft17: boolean;
    bettingMs: number;
    turnMs: number;
    insuranceMs: number;
    settleMs: number;
    dealerStepMs: number;
}

export const DEFAULT_CONFIG: TableConfig = {
    decks: 6,
    seats: 7,
    minBet: 5,
    maxBet: 1000,
    dealerStandsSoft17: true,
    bettingMs: 20000,
    turnMs: 25000,
    insuranceMs: 12000,
    settleMs: 2500,
    dealerStepMs: 700,
};

const MAX_HANDS_PER_SEAT = 4;
const BLACKJACK_PAYOUT = 1.5; // 3:2

interface InternalSeat extends Seat {
    /** Le joueur s'est déconnecté en pleine manche : siège libéré au règlement. */
    disconnected?: boolean;
}

export class BlackjackTable {
    readonly id: string;
    readonly name: string;
    readonly config: TableConfig;

    private hooks: TableHooks;
    private seats: InternalSeat[];
    private shoe: Card[] = [];
    private dealer: Card[] = [];
    private dealerHoleHidden = true;

    private phase: Phase = 'waiting';
    private activeSeat: number | null = null;
    private activeHand: number | null = null;

    private timer: NodeJS.Timeout | null = null;
    private deadline: number | null = null;
    /** Sièges ayant déjà décidé pour l'assurance (phase 'insurance'). */
    private insuranceDecided = new Set<number>();

    constructor(id: string, name: string, hooks: TableHooks, config: Partial<TableConfig> = {}) {
        this.id = id;
        this.name = name;
        this.hooks = hooks;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.seats = Array.from({ length: this.config.seats }, (_, index) => this.emptySeat(index));
    }

    /* ------------------------------------------------------------------ */
    /*  API publique (appelée par le manager depuis les events socket)    */
    /* ------------------------------------------------------------------ */

    sit(playerId: string, playerName: string, seatIndex: number): Result {
        const seat = this.seats[seatIndex];
        if (!seat) return fail('Siège invalide');
        if (seat.playerId && seat.playerId !== playerId) return fail('Siège déjà occupé');
        if (this.phase !== 'waiting' && this.phase !== 'betting') {
            return fail('Manche en cours, asseyez-vous au prochain tour');
        }

        seat.playerId = playerId;
        seat.playerName = playerName;
        seat.disconnected = false;

        // S'asseoir lance une phase de mise si la table était en attente.
        if (this.phase === 'waiting') this.startBetting();
        else this.broadcast();
        return ok();
    }

    leaveSeat(playerId: string, seatIndex: number): Result {
        const seat = this.seats[seatIndex];
        if (!seat || seat.playerId !== playerId) return fail('Ce siège n\'est pas le vôtre');

        if (this.phase === 'waiting' || this.phase === 'betting') {
            this.refundSeat(seat);
            this.resetSeat(seat);
            this.broadcast();
        } else {
            // En pleine manche : on laisse les mains finir, libération au règlement.
            seat.disconnected = true;
        }
        return ok();
    }

    /** Déconnexion : libère tous les sièges du joueur. */
    leaveAll(playerId: string): void {
        let changed = false;
        for (const seat of this.seats) {
            if (seat.playerId !== playerId) continue;
            if (this.phase === 'waiting' || this.phase === 'betting') {
                this.refundSeat(seat);
                this.resetSeat(seat);
            } else {
                seat.disconnected = true;
            }
            changed = true;
        }
        if (changed) this.broadcast();
    }

    placeBet(playerId: string, seatIndex: number, amount: number): Result {
        const seat = this.seats[seatIndex];
        if (!seat || seat.playerId !== playerId) return fail('Ce siège n\'est pas le vôtre');

        // Une mise pendant l'attente relance une manche.
        if (this.phase === 'waiting') this.startBetting();
        if (this.phase !== 'betting') return fail('Les mises sont fermées');

        amount = Math.floor(amount);

        // Mise à 0 = retrait : on rembourse la mise en attente.
        if (amount === 0) {
            this.refundSeat(seat);
            seat.pendingBet = 0;
            this.broadcast();
            return ok();
        }

        if (amount < this.config.minBet || amount > this.config.maxBet) {
            return fail(`Mise entre ${this.config.minBet} et ${this.config.maxBet}`);
        }

        // On rembourse l'ancienne mise avant d'appliquer la nouvelle.
        const previous = seat.pendingBet;
        const balance = this.hooks.getBalance(playerId) + previous;
        if (balance < amount) return fail('Solde insuffisant');

        if (previous > 0) this.hooks.adjustBalance(playerId, previous);
        this.hooks.adjustBalance(playerId, -amount);
        seat.pendingBet = amount;
        this.broadcast();
        return ok();
    }

    /** Remet la/les mise(s) de la manche précédente sur les sièges du joueur. */
    rebet(playerId: string): Result {
        if (this.phase === 'waiting') this.startBetting();
        if (this.phase !== 'betting') return fail('Les mises sont fermées');

        let any = false;
        for (const seat of this.seats) {
            if (seat.playerId !== playerId || seat.lastBet <= 0 || seat.pendingBet > 0) continue;
            if (this.hooks.getBalance(playerId) < seat.lastBet) continue; // pas assez : on saute
            this.hooks.adjustBalance(playerId, -seat.lastBet);
            seat.pendingBet = seat.lastBet;
            any = true;
        }
        if (!any) return fail('Aucune mise précédente à rejouer');
        this.broadcast();
        return ok();
    }

    /** Lance la distribution immédiatement, sans attendre la fin du minuteur. */
    forceDeal(playerId: string): Result {
        if (this.phase !== 'betting') return fail('Pas en phase de mise');
        if (!this.seats.some((s) => s.playerId === playerId)) return fail('Asseyez-vous d\'abord');
        if (!this.seats.some((s) => s.playerId && s.pendingBet > 0)) return fail('Aucune mise placée');
        this.deal();
        return ok();
    }

    act(playerId: string, seatIndex: number, handIndex: number, action: PlayerAction): Result {
        if (this.phase !== 'playerTurns') return fail('Ce n\'est pas la phase de jeu');
        if (seatIndex !== this.activeSeat || handIndex !== this.activeHand) return fail('Ce n\'est pas votre tour');

        const seat = this.seats[seatIndex];
        if (!seat || seat.playerId !== playerId) return fail('Ce siège n\'est pas le vôtre');

        const hand = seat.hands[handIndex];
        if (!hand || hand.status !== 'playing') return fail('Cette main ne peut plus jouer');

        switch (action) {
            case 'hit': return this.hit(seat, hand);
            case 'stand': return this.stand(hand);
            case 'double': return this.double(seat, hand);
            case 'split': return this.split(seat, handIndex);
            default: return fail('Action inconnue');
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Actions de jeu                                                    */
    /* ------------------------------------------------------------------ */

    private hit(seat: InternalSeat, hand: Hand): Result {
        hand.cards.push(this.draw());
        const { total } = handValue(hand.cards);
        if (total > 21) {
            hand.status = 'bust';
            this.advanceTurn();
        } else if (total === 21) {
            hand.status = 'stand';
            this.advanceTurn();
        } else {
            this.broadcast();
        }
        return ok();
    }

    private stand(hand: Hand): Result {
        hand.status = 'stand';
        this.advanceTurn();
        return ok();
    }

    private double(seat: InternalSeat, hand: Hand): Result {
        if (hand.cards.length !== 2) return fail('Double uniquement sur les 2 premières cartes');
        if (this.hooks.getBalance(seat.playerId!) < hand.bet) return fail('Solde insuffisant pour doubler');

        this.hooks.adjustBalance(seat.playerId!, -hand.bet);
        hand.bet *= 2;
        hand.cards.push(this.draw());
        hand.status = handValue(hand.cards).total > 21 ? 'bust' : 'doubled';
        this.advanceTurn();
        return ok();
    }

    private split(seat: InternalSeat, handIndex: number): Result {
        const hand = seat.hands[handIndex];
        if (hand.cards.length !== 2) return fail('Split uniquement sur une paire');
        if (cardRankValue(hand.cards[0]) !== cardRankValue(hand.cards[1])) return fail('Les deux cartes doivent être de même valeur');
        if (seat.hands.length >= MAX_HANDS_PER_SEAT) return fail('Nombre de mains maximum atteint');
        if (this.hooks.getBalance(seat.playerId!) < hand.bet) return fail('Solde insuffisant pour splitter');

        this.hooks.adjustBalance(seat.playerId!, -hand.bet);

        const splittingAces = hand.cards[0].rank === 'A';
        const moved = hand.cards.pop()!;
        const newHand: Hand = { cards: [moved], bet: hand.bet, status: 'playing', fromSplit: true };
        hand.fromSplit = true;

        // Une carte sur chaque main.
        hand.cards.push(this.draw());
        newHand.cards.push(this.draw());
        seat.hands.splice(handIndex + 1, 0, newHand);

        // Split d'As : une seule carte par main, pas d'action supplémentaire.
        if (splittingAces) {
            hand.status = 'stand';
            newHand.status = 'stand';
            this.advanceTurn();
            return ok();
        }

        // 21 après split n'est pas un blackjack : on s'arrête sans le compter comme tel.
        if (handValue(hand.cards).total === 21) {
            hand.status = 'stand';
            this.advanceTurn();
        } else {
            this.broadcast();
        }
        return ok();
    }

    /* ------------------------------------------------------------------ */
    /*  Machine à états                                                   */
    /* ------------------------------------------------------------------ */

    private startBetting(): void {
        this.clearTimer();
        this.phase = 'betting';
        this.dealer = [];
        this.dealerHoleHidden = true;
        this.activeSeat = null;
        this.activeHand = null;
        for (const seat of this.seats) {
            seat.hands = [];
            seat.pendingBet = 0;
        }
        this.setTimer(this.config.bettingMs, () => this.deal());
        this.broadcast();
    }

    private deal(): void {
        this.clearTimer();

        // Un joueur assis qui n'a pas misé est retiré du siège pour libérer la place.
        for (const seat of this.seats) {
            if (seat.playerId && seat.pendingBet === 0) this.resetSeat(seat);
        }

        const inPlay = this.seats.filter((s) => s.playerId && s.pendingBet > 0);
        if (inPlay.length === 0) {
            this.phase = 'waiting';
            this.broadcast();
            return;
        }

        if (this.shoe.length < this.config.decks * 52 * 0.25) {
            this.shoe = buildShoe(this.config.decks);
        }

        this.phase = 'dealing';
        for (const seat of inPlay) {
            seat.lastBet = seat.pendingBet; // mémorisé pour le « rebet »
            seat.hands = [{ cards: [], bet: seat.pendingBet, status: 'playing', fromSplit: false }];
        }
        this.dealer = [];
        this.dealerHoleHidden = true;

        // Deux tours de distribution : joueurs puis croupier.
        for (let round = 0; round < 2; round++) {
            for (const seat of inPlay) seat.hands[0].cards.push(this.draw());
            this.dealer.push(this.draw());
        }

        // Blackjacks naturels des joueurs.
        for (const seat of inPlay) {
            if (isBlackjack(seat.hands[0].cards)) seat.hands[0].status = 'blackjack';
        }

        const upcard = this.dealer[0];

        // Croupier montrant un As : on propose l'assurance avant tout.
        if (upcard.rank === 'A') {
            this.startInsurance();
            return;
        }

        // Sinon, peek silencieux sur une 10-valeur.
        if (cardRankValue(upcard) === 10 && isBlackjack(this.dealer)) {
            this.dealerHoleHidden = false;
            this.settle();
            return;
        }

        this.startPlayerTurns();
    }

    /* ------------------------------------------------------------------ */
    /*  Assurance                                                         */
    /* ------------------------------------------------------------------ */

    private startInsurance(): void {
        this.phase = 'insurance';
        this.insuranceDecided.clear();
        this.activeSeat = null;
        this.activeHand = null;
        this.setTimer(this.config.insuranceMs, () => this.resolveInsurance());
        this.broadcast();
    }

    /** Le joueur prend (moitié de la mise) ou refuse l'assurance. */
    insure(playerId: string, seatIndex: number, take: boolean): Result {
        if (this.phase !== 'insurance') return fail("Pas en phase d'assurance");
        const seat = this.seats[seatIndex];
        if (!seat || seat.playerId !== playerId) return fail('Ce siège n\'est pas le vôtre');
        const hand = seat.hands[0];
        if (!hand) return fail('Aucune main');
        if (this.insuranceDecided.has(seatIndex)) return fail('Choix déjà fait');

        if (take) {
            const amount = Math.floor(hand.bet / 2);
            if (this.hooks.getBalance(playerId) < amount) return fail('Solde insuffisant');
            this.hooks.adjustBalance(playerId, -amount);
            hand.insurance = amount;
        }

        this.insuranceDecided.add(seatIndex);

        // Tous les sièges en jeu ont décidé → on résout.
        const pending = this.seats.some((s) => s.playerId && s.hands.length > 0 && !this.insuranceDecided.has(s.index));
        if (pending) this.broadcast();
        else this.resolveInsurance();
        return ok();
    }

    private resolveInsurance(): void {
        this.clearTimer();
        const dealerBJ = isBlackjack(this.dealer);

        // L'assurance paie 2:1 (mise rendue + 2× la mise) si le croupier a blackjack.
        for (const seat of this.seats) {
            for (const hand of seat.hands) {
                if (hand.insurance && dealerBJ && seat.playerId) {
                    this.hooks.adjustBalance(seat.playerId, hand.insurance * 3);
                }
            }
        }

        if (dealerBJ) {
            this.dealerHoleHidden = false;
            this.settle();
        } else {
            this.startPlayerTurns(); // la carte cachée le reste, le jeu continue
        }
    }

    private startPlayerTurns(): void {
        this.phase = 'playerTurns';
        const next = this.findNextActionable(0, 0);
        if (!next) {
            this.dealerPlay();
            return;
        }
        this.activeSeat = next.seatIndex;
        this.activeHand = next.handIndex;
        this.setTimer(this.config.turnMs, () => this.onTurnTimeout());
        this.broadcast();
    }

    private advanceTurn(): void {
        this.clearTimer();
        const from = this.findNextActionable(this.activeSeat!, this.activeHand! + 1);
        if (!from) {
            this.dealerPlay();
            return;
        }
        this.activeSeat = from.seatIndex;
        this.activeHand = from.handIndex;
        this.setTimer(this.config.turnMs, () => this.onTurnTimeout());
        this.broadcast();
    }

    private onTurnTimeout(): void {
        if (this.activeSeat === null || this.activeHand === null) return;
        const hand = this.seats[this.activeSeat]?.hands[this.activeHand];
        if (hand && hand.status === 'playing') hand.status = 'stand';
        this.advanceTurn();
    }

    private dealerPlay(): void {
        this.clearTimer();
        this.phase = 'dealerTurn';
        this.dealerHoleHidden = false;
        this.activeSeat = null;
        this.activeHand = null;
        this.broadcast();
        this.dealerStep();
    }

    /** Le croupier tire une carte à la fois, avec une pause pour l'animation. */
    private dealerStep(): void {
        const anyLive = this.seats.some((s) =>
            s.hands.some((h) => h.status === 'stand' || h.status === 'doubled'),
        );
        const { total } = handValue(this.dealer);

        if (anyLive && total < 17) {
            this.timer = setTimeout(() => {
                this.dealer.push(this.draw());
                this.broadcast();
                this.dealerStep();
            }, this.config.dealerStepMs);
            return;
        }

        this.timer = setTimeout(() => this.settle(), this.config.dealerStepMs);
    }

    private settle(): void {
        this.clearTimer();
        this.phase = 'settle';
        this.dealerHoleHidden = false;

        const dealerVal = handValue(this.dealer).total;
        const dealerBust = dealerVal > 21;
        const dealerBlackjack = isBlackjack(this.dealer);

        for (const seat of this.seats) {
            for (const hand of seat.hands) {
                const payout = this.resolveHand(hand, dealerVal, dealerBust, dealerBlackjack);
                if (payout > 0 && seat.playerId) this.hooks.adjustBalance(seat.playerId, payout);
            }
        }

        this.broadcast();
        this.hooks.onRoundSettled(this);
        this.setTimer(this.config.settleMs, () => this.nextRound());
    }

    /** Calcule résultat + paiement (mise incluse) d'une main et l'écrit dessus. */
    private resolveHand(hand: Hand, dealerVal: number, dealerBust: boolean, dealerBlackjack: boolean): number {
        let result: Hand['result'];
        let payout = 0;

        if (hand.status === 'bust') {
            result = 'lose';
        } else if (hand.status === 'blackjack') {
            if (dealerBlackjack) {
                result = 'push';
                payout = hand.bet;
            } else {
                result = 'blackjack';
                // Mise rendue + gain 3:2.
                payout = hand.bet + Math.round(hand.bet * BLACKJACK_PAYOUT);
            }
        } else {
            const val = handValue(hand.cards).total;
            if (dealerBlackjack) {
                result = 'lose';
            } else if (dealerBust || val > dealerVal) {
                result = 'win';
                payout = hand.bet * 2;
            } else if (val === dealerVal) {
                result = 'push';
                payout = hand.bet;
            } else {
                result = 'lose';
            }
        }

        hand.result = result;
        hand.payout = payout;
        return payout;
    }

    private nextRound(): void {
        this.clearTimer();
        // Libère les sièges des joueurs partis et rembourse rien (manche finie).
        for (const seat of this.seats) {
            if (seat.disconnected) this.resetSeat(seat);
            else {
                seat.hands = [];
                seat.pendingBet = 0;
            }
        }
        this.dealer = [];
        this.dealerHoleHidden = true;

        if (this.seats.some((s) => s.playerId)) this.startBetting();
        else {
            this.phase = 'waiting';
            this.broadcast();
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                           */
    /* ------------------------------------------------------------------ */

    private findNextActionable(fromSeat: number, fromHand: number): { seatIndex: number; handIndex: number } | null {
        for (let s = fromSeat; s < this.seats.length; s++) {
            const seat = this.seats[s];
            const startHand = s === fromSeat ? fromHand : 0;
            for (let h = startHand; h < seat.hands.length; h++) {
                if (seat.hands[h].status === 'playing') {
                    // Une main d'un joueur déconnecté est automatiquement abandonnée.
                    if (seat.disconnected) {
                        seat.hands[h].status = 'stand';
                        continue;
                    }
                    return { seatIndex: s, handIndex: h };
                }
            }
        }
        return null;
    }

    private draw(): Card {
        if (this.shoe.length === 0) this.shoe = buildShoe(this.config.decks);
        return this.shoe.pop()!;
    }

    private refundSeat(seat: InternalSeat): void {
        if (seat.playerId && seat.pendingBet > 0) {
            this.hooks.adjustBalance(seat.playerId, seat.pendingBet);
        }
    }

    private resetSeat(seat: InternalSeat): void {
        Object.assign(seat, this.emptySeat(seat.index));
    }

    private emptySeat(index: number): InternalSeat {
        return { index, playerId: null, playerName: null, pendingBet: 0, lastBet: 0, hands: [], disconnected: false };
    }

    private setTimer(ms: number, cb: () => void): void {
        this.clearTimer();
        this.deadline = Date.now() + ms;
        this.timer = setTimeout(cb, ms);
    }

    private clearTimer(): void {
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        this.deadline = null;
    }

    private broadcast(): void {
        this.hooks.broadcast(this);
    }

    /** Nettoyage à la destruction de la table. */
    dispose(): void {
        this.clearTimer();
    }

    hasPlayers(): boolean {
        return this.seats.some((s) => s.playerId);
    }

    occupantIds(): string[] {
        return [...new Set(this.seats.map((s) => s.playerId).filter(Boolean) as string[])];
    }

    /* ------------------------------------------------------------------ */
    /*  Sérialisation pour le client                                      */
    /* ------------------------------------------------------------------ */

    snapshot(): TableSnapshot {
        const balances: Record<string, number> = {};
        for (const id of this.occupantIds()) balances[id] = this.hooks.getBalance(id);

        return {
            tableId: this.id,
            name: this.name,
            phase: this.phase,
            activeSeat: this.activeSeat,
            activeHand: this.activeHand,
            deadline: this.deadline,
            minBet: this.config.minBet,
            maxBet: this.config.maxBet,
            balances,
            dealer: {
                cards: this.dealer.map((c, i) =>
                    i === 1 && this.dealerHoleHidden ? ({ hidden: true } as SnapshotCard) : ({ ...c } as SnapshotCard),
                ),
                value: handValue(this.dealerHoleHidden ? this.dealer.slice(0, 1) : this.dealer).total,
                soft: handValue(this.dealerHoleHidden ? this.dealer.slice(0, 1) : this.dealer).soft,
            },
            seats: this.seats.map((seat) => ({
                index: seat.index,
                playerId: seat.playerId,
                playerName: seat.playerName,
                pendingBet: seat.pendingBet,
                lastBet: seat.lastBet,
                hands: seat.hands.map((hand) => {
                    const hv = handValue(hand.cards);
                    return {
                        cards: hand.cards.map((c) => ({ ...c }) as SnapshotCard),
                        bet: hand.bet,
                        value: hv.total,
                        soft: hv.soft,
                        status: hand.status,
                        insurance: hand.insurance,
                        result: hand.result,
                        payout: hand.payout,
                    };
                }),
            })),
        };
    }
}

type Result = { ok: boolean; error?: string };
const ok = (): Result => ({ ok: true });
const fail = (error: string): Result => ({ ok: false, error });

function cardRankValue(card: Card): number {
    if (card.rank === 'A') return 11;
    if (card.rank === 'K' || card.rank === 'Q' || card.rank === 'J' || card.rank === '10') return 10;
    return parseInt(card.rank, 10);
}
