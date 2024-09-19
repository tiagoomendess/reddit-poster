'use strict'

const puppeteer = require('puppeteer')
const URL = `https://e24.sapo.pt/cavado/barcelos/`
const cheerio = require('cheerio')

class E24 {
    constructor() {
    }

    async init() {
        console.log('Starting E24 scraper')
        this.browser = await puppeteer.launch({
            headless: true,
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

        console.log('E24 scraper is ready')
    }

    async run() {
        console.log("Checking E24 for news")
        await this.page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 })

        const bodyHandle = await this.page.$('body');
        let $ = cheerio.load(await this.page.evaluate(body => body.innerHTML, bodyHandle))

        let articles = []
        let list = $('.p-highlight > .overlay-holder > .p-featured > a')

        list.each((index, element) => {
            let title = $(element).attr('title').replace("Barcelos: ", "").trim()
            let url = $(element).attr('href')
            if (!title || !url || url == "#") return;

            articles.push({
                title: title.replace("\"", "").trim(),
                url: url
            })
        })

        console.log(`Found ${articles.length} articles on E24`)

        return articles;
    }

    async stop() {
        console.log('Stopping E24 scraper')
        await this.page.close()
        await this.browser.close()
        this.browser = null
    }
}

module.exports = E24
