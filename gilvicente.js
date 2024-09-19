'use strict'

const puppeteer = require('puppeteer')
const URL = `https://gilvicentefc.pt/noticias/`
const cheerio = require('cheerio')

class GilVicente {
    constructor() {
    }

    async init() {
        console.log('Starting GilVicente scraper')
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

        console.log('GilVicente scraper is ready')
    }

    async run() {
        console.log("Checking GilVicente for news")
        await this.page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 })

        const bodyHandle = await this.page.$('body');
        let $ = cheerio.load(await this.page.evaluate(body => body.innerHTML, bodyHandle))

        let articles = []
        let list = $('article > .card-content > .entry-title > a')

        list.each((index, element) => {
            let title = $(element).html().trim()
            let url = $(element).attr('href')
            if (!title || !url || url == "#") return;

            articles.push({
                title: title.replace("\"", "").trim(),
                url: url
            })
        })

        console.log(`Found ${articles.length} articles on GilVicente`)
        
        return articles;
    }

    async stop() {
        console.log('Stopping GilVicente scraper')
        await this.page.close()
        await this.browser.close()
        this.browser = null
    }
}

module.exports = GilVicente
