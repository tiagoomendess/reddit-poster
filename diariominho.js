'use strict'

const puppeteer = require('puppeteer')
const URL = `https://www.diariodominho.pt/noticias/barcelos`
const cheerio = require('cheerio')

class DiarioDoMinho {
    constructor() {
    }

    async init() {
        console.log('Starting Diario do Minho scraper')
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

        console.log('Diario do Minho scraper is ready')
    }

    async run() {
        console.log("Checking Diario do Minho for news")
        await this.page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
        const bodyHandle = await this.page.$('body');
        let $ = cheerio.load(await this.page.evaluate(body => body.innerHTML, bodyHandle))

        let articles = []
        let list = $('#main > div > div  > section > div > div > div > article')

        list.each((index, element) => {
            const link = $(element).find('a.card-link')
            let title = (link.attr('aria-label') || link.text() || '').replace(/^Link to /, '').trim()
            let url = link.attr('href')
            if (!title || !url || url == "#") return;

            articles.push({
                title: title.replace("\"", "").trim(),
                url: url
            })
        })

        console.log(`Found ${articles.length} articles Diario do Minho`)

        return articles;
    }

    async stop() {
        console.log('Stopping Diario do Minho scraper')
        await this.page.close()
        await this.browser.close()
        this.browser = null
    }

}

module.exports = DiarioDoMinho