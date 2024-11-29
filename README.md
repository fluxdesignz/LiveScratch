# LiveScratch
Real time collaboration extension for scratch!
# Run locally
- `git clone https://github.com/Waakul/LiveScratch.git`
- cd livescratch/backend
- `npm install`
- Create the env file based on .env.example.
- `npm run start` (This will create a pm2 process & start it).
- Additionally, `npm run stop` to stop the backend process & `npm run delete` to delete the pm2 process.
- Now go ahead and edit the file at extension/background.js, Replace the value of `apiUrl` to http://localhost:<PORT\>
- Now load the extension from chrome or any other chomium-based browsers and voila! You have ran livescratch locally.
# Contribute
Your free to go ahead and create a pull request for your work! It may be merged and you'll be credited!
# Credits:
- [@Waakul](https://github.com/Waakul) (Owner)
