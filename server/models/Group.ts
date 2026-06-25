import mongoose from 'mongoose';

interface IGroup extends mongoose.Document {
    leader: mongoose.Types.ObjectId;
    members: mongoose.Types.ObjectId[];
    invites: mongoose.Types.ObjectId[];
    maxSize: number;
    createdAt: Date;
    updatedAt: Date;
}

const GroupSchema = new mongoose.Schema<IGroup>(
    {
        leader: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
        members: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
        invites: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
        maxSize: {type: Number, default: 9, max: 9},
    },
    {timestamps: true},
);

GroupSchema.index({leader: 1});
GroupSchema.index({members: 1});

export default mongoose.model<IGroup>('Group', GroupSchema);
