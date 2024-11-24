require('dotenv').config();

module.exports = {
    apps: [
        {
            name: "LiveScratch",
            script: "./index.js",
            killTimeout: 60000
        }
    ]
};