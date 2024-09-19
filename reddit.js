'use strict'

const puppeteer = require('puppeteer')

const REDDIT_URL = 'https://old.reddit.com/'
const SUB_URL = (subreddit) => `https://old.reddit.com/r/${subreddit}/`

const SUBMIT_LINK_PATH = `submit`
const SUBMIT_TEXT_PATH = `submit?selftext=true`
const helpers = require('./helpers')

class Reddit {

    constructor(user, password) {
        this.isBooted = false
        this.user = user
        this.password = password
    }

    // Will lauch browser and login the user
    async init() {
        if (this.isBooted) {
            return
        }

        console.log('Starting reddit client')
        this.browser = await puppeteer.launch({
            headless: false,
            args: [
                `--window-size=1920,1000`
            ]
        })


        try {
            this.page = await this.browser.newPage();
            this.page.setViewport({
                height: 1000,
                width: 1920,
                deviceScaleFactor: 1
            })
            await helpers.wait(1000)
            
            await this.page.goto(REDDIT_URL, { waitUntil: 'networkidle2', timeout: 60000 })
            await this.page.type('input[name="user"]', this.user, { delay: 20 })
            await this.page.type('input[name="passwd"]', this.password, { delay: 20 })
            await this.page.click(`#login_login-main > div.submit > button`)
            await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
        } catch(error) {
            console.error('Error while trying to login', error)
            await this.browser.close()
            this.isBooted = false
            return
        }
        
        this.isBooted = true
        console.log('Reddit client ready to serve requests')
    }

    async post(subreddit, data = { type: "null", title: "null", content: "null"}) {

        var title = data.title.slice(0, 299)
        title = title.replace("&nbsp;", "")
        title = title.replace("&amp;", "&")
        title = title.replace("&quot;", "\"")

        switch(data.type) {
            case 'text':
                await this.page.goto(REDDIT_URL + SUBMIT_TEXT_PATH, { waitUntil: 'networkidle0', timeout: 10000 })
                await this.page.type('textarea[name="title"]', title)
                await this.page.type('textarea[name="text"]', data.content)
                break
            case 'link':
                await this.page.goto(REDDIT_URL + SUBMIT_LINK_PATH, { waitUntil: 'networkidle0', timeout: 10000 })
                await this.page.type('#url', data.content)
                await this.page.type('textarea[name="title"]', title)
                break
            default:
                throw new Error(`Invalid post type "${data.type}"`)
        }

        await this.page.type('#sr-autocomplete', subreddit, { delay: 40 }).catch()
        await helpers.wait(1000)
        await this.page.click('button[name="submit"').catch()
        await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch()
        await helpers.wait(1000)
        await this.page.goto(SUB_URL(subreddit), { waitUntil: 'networkidle2', timeout: 10000 }).catch()
    }

    async stop() {
        if (!this.isBooted) {
            return
        }

        this.isBooted = false
        await this.browser.close();
        console.log("Reddit client stopped")
    }

}

module.exports = Reddit