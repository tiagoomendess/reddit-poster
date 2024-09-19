'use strict'

const puppeteer = require('puppeteer')
const URL = `https://domingoasdez.com/noticias`
const cheerio = require('cheerio')
const helpers = require('./helpers')

class DomingoAsDez {
    constructor() {
    }

    async init() {
        console.log('Starting DomingoAsDez scraper')
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

        console.log('DomingoAsDez scraper is ready')
    }

    async run() {
        console.log("Checking DomingoAsDez for news")
        await this.page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
        const bodyHandle = await this.page.$('body');
        let $ = cheerio.load(await this.page.evaluate(body => body.innerHTML, bodyHandle))

        let articles = []
        
        let list = $('.card,.medium,.hoverable')

        list.each((index, element) => {
            articles.push({
                title: $(element).find('.card-title').html(),
                url: $(element).find('a').attr('href')
            })
        })

        console.log(`Found ${articles.length} articles on Domingo às Dez`)

        return articles;
    }

    async stop() {
        console.log('Stopping Domingo às Dez scraper')
        await this.page.close()
        await this.browser.close()
        this.browser = null
    }

}

module.exports = DomingoAsDez