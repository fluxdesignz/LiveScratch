const result = require('dotenv').config();
if (result.error) {
    console.error('No .env file found, Create one using .env.example');
    process.exit(1);
}

module.exports = {
    apps: [
        {
            name: "LiveScratch",
            script: "./index.js",
            killTimeout: 60000
        }
    ]
};