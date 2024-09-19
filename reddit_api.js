const snoowrap = require('snoowrap');

class RedditApi {
    constructor(clientId, clientSecret, username, password) {
        this.client = new snoowrap({
            userAgent: `script:reddit_poster:v1.0 (by /u/${username})`,
            clientId: clientId,
            clientSecret: clientSecret,
            username: username,
            password: password
          });
    }

    async submitLink(subredditName, title, url) {
        try {
            let subreddit = await this.client.getSubreddit(subredditName);
            await subreddit.submitLink({ title, url });
            console.log(`Posted to r/${subredditName}: ${title}`);
            return true;
          } catch (error) {
            console.error('Failed to post:', error);
            return false;
          }
    }
}

module.exports = RedditApi;
