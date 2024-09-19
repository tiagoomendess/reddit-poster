'use strict'

const puppeteer = require('puppeteer')
const URL = `https://www.jn.pt/local/braga/barcelos/`
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

    async run() {
        console.log("Checking JN for news")
        await this.page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 })
        await helpers.wait(1000)
        const bodyHandle = await this.page.$('body');
        let $ = cheerio.load(await this.page.evaluate(body => body.innerHTML, bodyHandle))

        let articles = []
        let list = $('.sk-container > .sk-wrapper > .sk320-1')

        list.each((index, element) => {
            let title = $(element).find('h2').html().trim()
            let url = $(element).find('a').attr('href')
            if (!title || !url || url == "#") return;

            articles.push({
                title: title.replace("\"", "").trim(),
                url: 'https://jn.pt' + url
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