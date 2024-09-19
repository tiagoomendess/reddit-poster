'use strict'

const puppeteer = require('puppeteer')
const URL = `https://ominho.pt/seccao/noticias/cavado/barcelos/`
const cheerio = require('cheerio')
const helpers = require('./helpers')

class OMinho {
    constructor() {
    }

    async init() {
        console.log('Starting O Minho scraper')
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

        console.log('O Minho scraper is ready')
    }

    async run() {
        console.log("Checking O Minho for news")
        await this.page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 })
        const bodyHandle = await this.page.$('body');
        let $ = cheerio.load(await this.page.evaluate(body => body.innerHTML, bodyHandle))

        let articles = []
        
        let list = $('.cs-posts-area__main .cs-entry__title > a')
        list.each((index, element) => {
            articles.push({
                title: $(element).html().replace("\"", "").trim(),
                url: $(element).attr('href')
            })
        })

        console.log(`Found ${articles.length} articles on O Minho`)

        return articles;
    }

    async stop() {
        console.log('Stopping O Minho scraper')
        await this.page.close()
        await this.browser.close()
        this.browser = null
    }
}

module.exports = OMinho