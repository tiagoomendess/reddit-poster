'use strict'

const puppeteer = require('puppeteer')
const URL = `https://www.cm-barcelos.pt/categorias/noticias/`
const cheerio = require('cheerio')
const helpers = require('./helpers')

class CMBarcelos {
    constructor() {
    }

    async init() {
        console.log('Starting CMBarcelos scraper')
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

        console.log('CMBarcelos scraper is ready')
    }

    async run() {
        console.log("Checking CMBarcelos for news")
        await this.page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
        const bodyHandle = await this.page.$('body');
        let $ = cheerio.load(await this.page.evaluate(body => body.innerHTML, bodyHandle))

        let articles = []
        
        let list = $('.default-blog-post')

        list.each((index, element) => {
            articles.push({
                title: $(element).find('h4 > a').html(),
                url: $(element).find('h4 > a').attr('href')
            })
        })

        console.log(`Found ${articles.length} articles on CM Barcelos`)

        return articles;
    }

    async stop() {
        console.log('Stopping CM Barcelos scraper')
        await this.page.close()
        await this.browser.close()
        this.browser = null
    }

}

module.exports = CMBarcelos