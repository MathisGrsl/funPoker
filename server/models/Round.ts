import mongoose from 'mongoose';

interface GameAction {
    playerId: mongoose.Types.ObjectId;
    action: 'fold' | 'call' | 'raise' | 'check' | 'all-in' | 'bet';
    amount: number;
    timestamp: number;
    pot: number;
}

interface IRound extends mongoose.Document {
    game?: mongoose.Types.ObjectId; // Référence à la partie
    roundNumber?: number;
    players: mongoose.Types.ObjectId[];
    maxPlayers: number;
    PlayerTurn: mongoose.Types.ObjectId;
    pot: number;
    betOfEachPlayer: {
        player: mongoose.Types.ObjectId;
        amount: number;
    }[];
    moneyOfEachPlayer: {
        player: mongoose.Types.ObjectId;
        amount: number;
    }[];
    currentBet: number;
    blinds: {
        small: number;
        big: number;
    };
    dealer?: mongoose.Types.ObjectId;
    smallBlind?: mongoose.Types.ObjectId;
    bigBlind?: mongoose.Types.ObjectId;
    boardCards: string[];
    hands: {
        player: mongoose.Types.ObjectId;
        cards: string[];
    }[];

    // 🆕 Pour le replay
    actions?: GameAction[];
    winners?: mongoose.Types.ObjectId[];

    status: 'active' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

const RoundSchema = new mongoose.Schema<IRound>(
    {
        game: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Game',
            default: null,
        },
        roundNumber: {
            type: Number,
            default: 1,
        },
        players: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        maxPlayers: {
            type: Number,
            default: 5,
        },
        PlayerTurn: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        pot: {
            type: Number,
            default: 0,
        },
        betOfEachPlayer: [
            {
                player: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                amount: {
                    type: Number,
                    default: 0,
                },
            },
        ],
        moneyOfEachPlayer: [
            {
                player: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                amount: {
                    type: Number,
                    default: 0,
                },
            },
        ],
        currentBet: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['active', 'completed', 'cancelled'],
            default: 'active',
        },
        dealer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        smallBlind: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        bigBlind: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        boardCards: [String],
        hands: [
            {
                player: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                cards: [String],
            },
        ],

        // 🆕 Actions du round (pour replay)
        actions: [
            {
                playerId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                action: {
                    type: String,
                    enum: ['fold', 'call', 'raise', 'check', 'all-in', 'bet'],
                },
                amount: Number,
                timestamp: Number,
                pot: Number,
            },
        ],

        // 🆕 Gagnants du round
        winners: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    {timestamps: true},
);

export default mongoose.model<IRound>('Round', RoundSchema);
