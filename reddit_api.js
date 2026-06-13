const snoowrap = require('snoowrap');
const helpers = require('./helpers');

class RedditApi {
    constructor(clientId, clientSecret, username, password) {
        this.client = new snoowrap({
            userAgent: `script:reddit_poster:v1.0 (by /u/${username})`,
            clientId: clientId,
            clientSecret: clientSecret,
            username: username,
            password: password
        });

        // snoowrap starts with _nextRequestTimestamp = -Infinity, which triggers
        // TimeoutNegativeWarning on Node.js 24+ and can break request timing.
        this.client._nextRequestTimestamp = Date.now();
        this.client.config({ requestDelay: 1000 });
    }

    async approveSubmission(submission) {
        await submission.approve();
    }

    async submitLink(subredditName, title, url) {
        title = helpers.cleanTitle(title)

        let submission;
        try {
            const subreddit = await this.client.getSubreddit(subredditName);
            submission = await subreddit.submitLink({ title, url });
        } catch (error) {
            console.error('Failed to post:', error.message || error);
            return false;
        }

        try {
            await this.approveSubmission(submission);
            console.log(`Posted and approved on r/${subredditName}: ${title}`);
        } catch (error) {
            console.warn(`Posted but failed to approve on r/${subredditName}: ${title}`, error.message || error);
        }

        return true;
    }
}

module.exports = RedditApi;
