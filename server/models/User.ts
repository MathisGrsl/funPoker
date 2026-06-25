import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser extends mongoose.Document {
    email: string;
    username: string;
    password?: string;
    googleId?: string;
    uniqueId?: string;
    avatar?: string;
    credit: number;
    VirtualCredit: number;
    creditsHistory: {
        amount: number;
        date: Date;
    }[];
    totalBet: number;
    level: number;
    settings: {
        sound: boolean;
        notifications: boolean;
        foreward: string;
        back: string;
        left: string;
        right: string;
    };
    friends: mongoose.Types.ObjectId[];
    friendRequests: mongoose.Types.ObjectId[];
    roundsPlayed: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
    matchPassword(enteredPassword: string): Promise<boolean>;
}

const UserSchema = new mongoose.Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, 'enter an email'],
            unique: true,
            lowercase: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'enter a valid email'],
        },
        username: {
            type: String,
            required: [true, 'enter a username'],
            unique: true,
        },
        password: {
            type: String,
            minlength: 6,
            select: false, // Ne pas retourner le mot de passe par défaut
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true, // Permet les valeurs null/undefined uniques
        },
        uniqueId: {
            type: String,
            unique: true,
            sparse: true,
        },
        avatar: {
            type: String,
            default: null,
        },
        credit: {
            type: Number,
            default: 0, // Montant initial pour les nouveaux utilisateurs
        },
        VirtualCredit: {
            type: Number,
            default: 0, // Montant initial pour les nouveaux utilisateurs
        },
        creditsHistory: [
            {
                amount: Number,
                date: Date,
            },
        ],
        totalBet: {
            type: Number,
            default: 0,
        },
        level: {
            type: Number,
            default: 1,
        },
        settings: {
            sound: {
                type: Boolean,
                default: true,
            },
            notifications: {
                type: Boolean,
                default: true,
            },
            foreward: {
                type: String,
                default: 'z',
            },
            back: {
                type: String,
                default: 's',
            },
            left: {
                type: String,
                default: 'q',
            },
            right: {
                type: String,
                default: 'd',
            },
        },
        //social features
        friends: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        friendRequests: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        roundsPlayed: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Round',
            },
        ],
    },
    {timestamps: true},
);

// Middleware pour hacher le mot de passe avant de sauvegarder
UserSchema.pre('save', async function () {
    // Si le mot de passe n'a pas été modifié, on continue
    if (!this.isModified('password')) {
        return;
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password!, salt);
    } catch (error) {
        throw error;
    }
});

// Méthode pour comparer les mots de passe
UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
