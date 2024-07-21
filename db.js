const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const dbUri = process.env.MONGODB_URI;

mongoose.connect(dbUri, {
    // useNewUrlParser: true, // Deprecated
    // useUnifiedTopology: true, // Deprecated
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

module.exports = db;
