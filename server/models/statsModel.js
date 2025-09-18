const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    singleton: { type: String, default: 'main_stats', unique: true },
    totalVisits: { type: Number, default: 0 },
    analysesCreated: { type: Number, default: 0 },
    logins: { type: Number, default: 0 }
}, { timestamps: true });

statsSchema.statics.increment = async function(field) {
    return this.findOneAndUpdate(
        { singleton: 'main_stats' },
        { $inc: { [field]: 1 } },
        { new: true, upsert: true }
    );
};

module.exports = mongoose.model('Stats', statsSchema);