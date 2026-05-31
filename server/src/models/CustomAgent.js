import mongoose from 'mongoose';

const CustomAgentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    icon: { type: String, default: '🤖' },
    role: { type: String, required: true },
    brief: { type: String, required: true }, // The system prompt
    temperature: { type: Number, default: 0.5, min: 0, max: 1 },
    defaultPhase: { type: String, enum: ['catalyst', 'discuss', 'challenge', 'verdict'], default: 'discuss' }
  },
  { timestamps: true }
);

export const CustomAgent = mongoose.model('CustomAgent', CustomAgentSchema);
