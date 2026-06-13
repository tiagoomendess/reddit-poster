const snoowrap = require('snoowrap');
const requestHandler = require('snoowrap/dist/request_handler.js');
const snoowrapPromise = require('snoowrap/dist/Promise.js').default;
const helpers = require('./helpers');

// snoowrap computes waitTime as (_nextRequestTimestamp - now), which is negative when the
// client is created long before the first API call (e.g. after scraping). Node.js 24+ warns on
// negative setTimeout values (TimeoutNegativeWarning). Clamp to zero — same behavior, no warning.
requestHandler._awaitRequestDelay = function () {
    const now = Date.now();
    const waitTime = Math.max(0, this._nextRequestTimestamp - now);
    this._nextRequestTimestamp = Math.max(now, this._nextRequestTimestamp) + this._config.requestDelay;
    return snoowrapPromise.delay(waitTime);
};

class RedditApi {
    constructor(clientId, clientSecret, username, password) {
        this.client = new snoowrap({
            userAgent: `script:reddit_poster:v1.0 (by /u/${username})`,
            clientId: clientId,
            clientSecret: clientSecret,
            username: username,
            password: password
        });

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

    async createTextPost(subredditName, title, selftext) {
        title = helpers.cleanTitle(title)

        let submission;
        try {
            const subreddit = await this.client.getSubreddit(subredditName);
            submission = await subreddit.submitSelfpost({ title, text: selftext });
        } catch (error) {
            console.error('Failed to create text post:', error.message || error);
            return null;
        }

        try {
            await this.approveSubmission(submission);
            console.log(`Posted and approved text post on r/${subredditName}: ${title}`);
        } catch (error) {
            console.warn(`Posted but failed to approve text post on r/${subredditName}: ${title}`, error.message || error);
        }

        return submission;
    }

    async editPost(submission, selftext) {
        try {
            await submission.edit(selftext);
            console.log(`Edited post: ${submission.title}`);
            return true;
        } catch (error) {
            console.error('Failed to edit post:', error.message || error);
            return false;
        }
    }

    async findPostByTitle(subredditName, title) {
        title = helpers.cleanTitle(title)
        const subredditLower = subredditName.toLowerCase();

        try {
            const user = await this.client.getMe();
            const submissions = await user.getSubmissions({ limit: 100 });

            for (const submission of submissions) {
                const submissionSubreddit = submission.subreddit.display_name.toLowerCase();
                if (submission.title === title && submissionSubreddit === subredditLower) {
                    return submission;
                }
            }
        } catch (error) {
            console.error('Failed to find post by title:', error.message || error);
        }

        return null;
    }
}

module.exports = RedditApi;
