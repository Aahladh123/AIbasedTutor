const mongoose = require('mongoose');
const transcriptSchema = new mongoose.Schema({
    videoId: {type: String,required: true,unique: true},
    title: {type: String,required: true},
    cachedAt: { type: Date, required: true, default: Date.now }
}, );

const Transcript = mongoose.model('Transcript', transcriptSchema);
module.exports = Transcript;
