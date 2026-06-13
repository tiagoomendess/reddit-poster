'use strict'

const fs = require('fs');
const RedditApi = require('./reddit_api')

const POSTED_URLS_FILE_NAME = `posted.txt`
const POSTED_TITLES_FILE_NAME = `posted_titles.txt`
const MAX_TITLES_TO_COMPARE = 40
const MAX_URLS_TO_COMPARE = 1000
const SIMILARITY_THRESHOLD = 0.35
const helpers = require('./helpers')
const constants = require('./constants')

class Poster {
    constructor() {
        console.log(`Starting Poster`)

        this.ensurePostedFiles()
        this.aggregatedPosted = {}

        this.flairGuessingEnabled = process.env.FLAIR_GUESSING_ENABLED === 'true'

        this.redditApi = new RedditApi(
            process.env.REDDIT_APP_ID || 'app_id',
            process.env.REDDIT_SECRET || 'secret',
            process.env.REDDIT_USERNAME || 'user',
            process.env.REDDIT_PASSWORD || 'password'
        )

        this.posted = fs.readFileSync(POSTED_URLS_FILE_NAME)
            .toString()
            .split("\r\n")
            .filter(line => line.trim() !== "");

        this.postedTitles = fs.readFileSync(POSTED_TITLES_FILE_NAME)
            .toString()
            .split("\r\n")
            .filter(line => line.trim() !== "")
            .slice(-MAX_TITLES_TO_COMPARE);

        console.log(`[i] Loaded ${this.posted.length} links that were already posted`)
        console.log(`[i] Loaded ${this.postedTitles.length} titles that were already posted`)
        console.log(`[i] Poster is ready`)
    }

    async postArticles(articles) {
        let successes = 0
        let ignored = 0
        let failed = 0

        for (let i = 0; i < articles.length; i++) {
            if (this.posted.includes(articles[i].url)) {
                ignored++
                continue
            }

            if (!articles[i].ignoreSimilarityCheck && this.similarAlreadyPosted(articles[i].title)) {
                ignored++
                continue
            }

            console.log(`[+] Posting article ${articles[i].title}`)

            let success = await this.postArticle(articles[i])

            if (success) {
                successes++
                this.posted.push(articles[i].url)
                this.postedTitles.push(articles[i].title)
                fs.appendFileSync(POSTED_URLS_FILE_NAME, `\r\n${articles[i].url}`)
                fs.appendFileSync(POSTED_TITLES_FILE_NAME, `\r\n${articles[i].title}`)

                // if postedTitles is bigger than 25, remove the first element
                if (this.postedTitles.length > MAX_TITLES_TO_COMPARE) {
                    this.postedTitles.shift()
                }

            } else {
                failed++
                console.log(`[?] Could not post article...`)
            }
        }

        console.log(`\n[i] Posted ${successes} links, ignored ${ignored} and ${failed} failed, out of ${articles.length} articles found.\n`)
    }

    similarAlreadyPosted(title) {
        //console.log(`Checking Title Similarity of "${title}"`)
        // for all posted titles
        for (let i = 0; i < this.postedTitles.length; i++) {
            // if the title is similar to a posted title
            const similarity = helpers.jaccardSimilarity(title, this.postedTitles[i])
            //console.log(`  - ${similarity} against:\t "${this.postedTitles[i]}"`)
            if (similarity >= SIMILARITY_THRESHOLD) {
                console.log(`[!] Ignoring "${title}" because is similar (${similarity}) to a posted article: "${this.postedTitles[i]}"`)
                return true
            }
        }

        return false
    }

    guessFlair(article) {
        if (!article) {
            return null
        }

        // If already comes with a flair, return it
        if (article.flairId) {
            console.log(`\tUsing provided flair ${article.flairId}`)
            return article.flairId
        }

        // If flair guessing is disabled, return null
        if (!this.flairGuessingEnabled) {
            console.log(`\tFlair guessing is disabled`)
            return null
        }

        const title = article.title.toLowerCase().trim()
        const resultsMap = {}
        let hasGuess = false

        // loop through all the flair guessing rules
        // If a work in the FLAIR_MATCH[key] matches a work from the title, add 1 point to resultsMap[key]
        // needs to match whole word and not partials
        Object.keys(constants.FLAIR_MATCH).forEach((key) => {
            //console.log(`Checking rule for ${key}`)
            if (constants.FLAIR_MATCH[key].length <= 0) {
                return
            }

            let regexStr = constants.FLAIR_MATCH[key].map(word => `\\b${word}\\b`).join('|')
            const regex = new RegExp(regexStr, 'g')
            resultsMap[key] = (title.match(regex) || []).length

            if (resultsMap[key] > 0) {
                hasGuess = true
            }
        })

        // If no matches, return null
        if (!hasGuess) {
            console.log(`\tNo matches for flair guessing`)
            return null
        }

        // Sort from highest to lowest value
        const sorted = Object.keys(resultsMap).sort((a, b) => resultsMap[b] - resultsMap[a])

        console.log(`\tGuessed flair ${sorted[0]} ${constants.FLAIRS[sorted[0]]} for "${title}"`)

        return constants.FLAIRS[sorted[0]] || null
    }

    ensurePostedFiles() {
        if (!fs.existsSync(POSTED_URLS_FILE_NAME)) {
            fs.writeFileSync(POSTED_URLS_FILE_NAME, '')
        }

        if (!fs.existsSync(POSTED_TITLES_FILE_NAME)) {
            fs.writeFileSync(POSTED_TITLES_FILE_NAME, '')
        }
    }

    async postArticle(article) {
        await helpers.wait(1000) // Wait 1 second before posting, no spamming

        if (article.aggregateUnderTitle) {
            return await this.postAggregated(article)
        } else {
            return await this.postSingle(article)
        }
    }

    // Will post a new standalone link
    async postSingle(article) {
        return await this.redditApi.submitLink(
            'barcelos',
            article.title,
            article.url,
            this.guessFlair(article)
        )
    }

    // Instead of new submission, will try to find a post to edit and add under an aggregator title
    // Will create e new one if not exists yet
    async postAggregated(article) {

        // make a string with date, hour and minute
        let now = new Date()
        let day = now.getDate()
        if (day < 10) {
            day = `0${day}`
        }

        // Override day if article has it
        if (article.day) {
            day = article.day
        }

        const linkTitle = helpers.cleanTitle(article.title)

        // try finding post by title in aggregatedPosted
        let post = this.aggregatedPosted[article.aggregateUnderTitle]
        let markdown = ''

        // wait 3 seconds because yes
        await helpers.wait(3000)
        
        // if no post yet, try reddit api
        if (!post) {
            console.log(`[+] Aggregator post not found in memory, searching on reddit`)
            post = await this.redditApi.findPostByTitle('barcelos', article.aggregateUnderTitle)
            this.aggregatedPosted[article.aggregateUnderTitle] = post
        }

        if (post) {
            console.log(`[+] Aggregator post found, editing`)
            const currentSelftext = await post.selftext;
            markdown = `${currentSelftext}\n- Dia ${day} > [${linkTitle}](${article.url})`

            // update local post with new markdown
            this.aggregatedPosted[article.aggregateUnderTitle].selftext = markdown

            return await this.redditApi.editPost(post, markdown)
        } else {
            console.log(`[!] Aggregator post not found, creating a new one`)

            // markdown of the article title with a link
            markdown = `- Dia ${day} > [${linkTitle}](${article.url})`
            let newPost = await this.redditApi.createTextPost('barcelos', article.aggregateUnderTitle, markdown)

            if (!newPost) {
                console.log(`[!] Could not create aggregator post`)
                return false
            }

            // Save aggregated post because search cannot find it in first minutes after posting first time
            this.aggregatedPosted[article.aggregateUnderTitle] = newPost

            return true
        }
    }
}

module.exports = Poster
