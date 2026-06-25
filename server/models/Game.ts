import mongoose from 'mongoose';

interface IGamePlayer {
    player: mongoose.Types.ObjectId;
    buyin: number;
    chipStack: number;
    status: 'active' | 'folded' | 'eliminated' | 'all-in';
    position?: 'dealer' | 'small_blind' | 'big_blind' | 'regular';
    profit: number;
    holeCards?: Array<{
        suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
        rank: 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
    }>;
}

interface IGameStatistics {
    totalPot: number;
    totalRaises: number;
    averageBet: number;
    handsPlayed: number;
}

interface IGame extends mongoose.Document {
    gameCode: string;
    name: string;
    owner: mongoose.Types.ObjectId;
    players: IGamePlayer[];
    maxPlayers: number;
    currentRound: mongoose.Types.ObjectId;
    allRounds: mongoose.Types.ObjectId[];
    gameStatus: 'waiting' | 'active' | 'paused' | 'completed' | 'cancelled';
    gameType: 'cash' | 'tournament' | 'sit-n-go';

    // Blind configuration
    blinds: {
        small: number;
        big: number;
    };
    buyinAmount: number;
    minBuyIn: number;
    maxBuyIn: number;

    // Game settings
    timeLimit?: number; // en secondes
    actionTimeout?: number; // en secondes pour chaque action
    rebuysAllowed: boolean;
    rebuyAmount?: number;

    // Game statistics
    statistics: IGameStatistics;

    // Tracking
    roundNumber: number;
    startedAt: Date;
    pausedAt?: Date;
    endedAt?: Date;
    winners: {
        player: mongoose.Types.ObjectId;
        amount: number;
        position: number;
    }[];

    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

const GamePlayerSchema = new mongoose.Schema<IGamePlayer>(
    {
        player: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        buyin: {
            type: Number,
            required: true,
        },
        chipStack: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'folded', 'eliminated', 'all-in'],
            default: 'active',
        },
        position: {
            type: String,
            enum: ['dealer', 'small_blind', 'big_blind', 'regular'],
        },
        holeCards: [
            {
                suit: {
                    type: String,
                    enum: ['hearts', 'diamonds', 'clubs', 'spades'],
                },
                rank: {
                    type: String,
                    enum: ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'],
                },
                _id: false,
            },
        ],
        profit: {
            type: Number,
            default: 0,
        },
    },
    {_id: false},
);

const GameStatisticsSchema = new mongoose.Schema<IGameStatistics>(
    {
        totalPot: {
            type: Number,
            default: 0,
        },
        totalRaises: {
            type: Number,
            default: 0,
        },
        averageBet: {
            type: Number,
            default: 0,
        },
        handsPlayed: {
            type: Number,
            default: 0,
        },
    },
    {_id: false},
);

const GameSchema = new mongoose.Schema<IGame>(
    {
        gameCode: {
            type: String,
            unique: true,
            required: true,
            uppercase: true,
        },
        name: {
            type: String,
            required: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        players: [GamePlayerSchema],
        maxPlayers: {
            type: Number,
            required: true,
            default: 6,
            min: 2,
            max: 10,
        },
        currentRound: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Round',
        },
        allRounds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Round',
            },
        ],
        gameStatus: {
            type: String,
            enum: ['waiting', 'active', 'paused', 'completed', 'cancelled'],
            default: 'waiting',
        },
        gameType: {
            type: String,
            enum: ['cash', 'tournament', 'sit-n-go'],
            default: 'cash',
        },
        blinds: {
            small: {
                type: Number,
                required: true,
            },
            big: {
                type: Number,
                required: true,
            },
        },
        buyinAmount: {
            type: Number,
            required: true,
        },
        minBuyIn: {
            type: Number,
            required: true,
        },
        maxBuyIn: {
            type: Number,
            required: true,
        },
        timeLimit: {
            type: Number,
        },
        actionTimeout: {
            type: Number,
            default: 30,
        },
        rebuysAllowed: {
            type: Boolean,
            default: true,
        },
        rebuyAmount: {
            type: Number,
        },
        statistics: GameStatisticsSchema,
        roundNumber: {
            type: Number,
            default: 0,
        },
        startedAt: {
            type: Date,
        },
        pausedAt: {
            type: Date,
        },
        endedAt: {
            type: Date,
        },
        winners: [
            {
                player: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                amount: Number,
                position: Number,
            },
        ],
    },
    {
        timestamps: true,
    },
);

// Index pour améliorer les requêtes
GameSchema.index({owner: 1});
GameSchema.index({gameStatus: 1});
GameSchema.index({createdAt: -1});

const Game = mongoose.model<IGame>('Game', GameSchema);

export {Game, IGame, IGamePlayer, IGameStatistics};
