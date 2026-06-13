'use strict'

const puppeteer = require('puppeteer')
const URL = `https://www.jn.pt/topico/barcelos`
const cheerio = require('cheerio')
const helpers = require('./helpers')

class JN {
    constructor() {
    }

    async init() {
        console.log('Starting JN scraper')
        this.browser = await puppeteer.launch({
            headless: helpers.HEADLESS,
            args: [
                `--window-size=1280,720`
            ]
        })

        this.page = await this.browser.newPage();
        this.page.setViewport({
            height: 720,
            width: 1280,
            deviceScaleFactor: 1
        })

        console.log('JN scraper is ready')
    }

    async acceptConsent() {
        await helpers.wait(2000)
        for (const frame of this.page.frames()) {
            try {
                for (const btn of await frame.$$('button')) {
                    const text = await frame.evaluate(el => el.textContent, btn)
                    if (text && /consentir|aceitar|agree/i.test(text)) {
                        await btn.click()
                        await helpers.wait(2000)
                        return
                    }
                }
            } catch (e) {}
        }
    }

    async run() {
        console.log("Checking JN for news")
        await this.page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 })
        await this.acceptConsent()
        const bodyHandle = await this.page.$('body');
        let $ = cheerio.load(await this.page.evaluate(body => body.innerHTML, bodyHandle))

        let articles = []
        let list = $('article a[class*="TitleLink"]')

        list.each((index, element) => {
            let title = $(element).text().trim()
            let url = $(element).attr('href')
            if (!title || !url || url == "#") return;

            articles.push({
                title: title.replace("\"", "").trim(),
                url: url.startsWith('http') ? url : `https://www.jn.pt${url}`
            })
        })

        console.log(`Found ${articles.length} articles on JN`)

        return articles;
    }

    async stop() {
        console.log('Stopping JN scraper')
        await this.page.close()
        await this.browser.close()
        this.browser = null
    }
}

module.exports = JN