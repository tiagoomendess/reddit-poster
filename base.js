'use strict'

const puppeteer = require('puppeteer')
const URL = `https://www.base.gov.pt/Base4/pt/pesquisa/?type=contratos&texto=&tipo=0&tipocontrato=0&cpv=&aqinfo=&adjudicante=&adjudicataria=&sel_price=price_c1&desdeprecocontrato=%E2%82%AC10.000%2C00&ateprecocontrato=&desdeprecoefectivo=&ateprecoefectivo=&desdeprazoexecucao=&ateprazoexecucao=&sel_date=date_c1&desdedatacontrato=&atedatacontrato=&desdedatapublicacao=&atedatapublicacao=&desdedatafecho=&atedatafecho=&pais=187&distrito=4&concelho=39`
const cheerio = require('cheerio')
const helpers = require('./helpers')

class Base {
    constructor() {
    }

    async init() {
        console.log('Starting Base scraper')
        this.browser = await puppeteer.launch({
            headless: helpers.HEADLESS,
            args: [
                `--window-size=1920,1080`
            ]
        })

        this.page = await this.browser.newPage();
        this.page.setViewport({
            height: 1080,
            width: 1920,
            deviceScaleFactor: 1
        })

        console.log('Base scraper is ready')
    }

    async run() {
        console.log("Checking Base for Contracts")
        await this.page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 })
        await helpers.wait(1000)
        const bodyHandle = await this.page.$('body')
        let $ = cheerio.load(await this.page.evaluate(body => body.innerHTML, bodyHandle))

        let articles = []
        
        let list = $('tbody > tr')

        list.each((index, element) => {
            let procedimento = $(element).find('td[data-title="Tipo de procedimento"]').html().trim()
            let adjudicante = $(element).find('td[data-title="Adjudicante"]').html().trim()
            let adjucatario = $(element).find('td[data-title="Adjudicatário"]').html().trim()
            let object = $(element).find('td[data-title="Objeto do contrato"]').html().trim()
            let price = $(element).find('td[data-title="Preço contratual"]').html().trim()
            price = price.split(',')[0]
            price = price.replace('.', ' ')

            if (object.length > 103)
                object = object.slice(0, 100) + '...'

            let title = `${adjudicante} paga ${price}€ a ${adjucatario} para ${object} - ${procedimento}`
            let url = $(element).find('a').attr('href')

            articles.push({
                title: title,
                url: url.includes('http') ? url : `https://www.base.gov.pt${url}`
            })
        })

        console.log(`Found ${articles.length} contracts on Base`)

        return articles;
    }

    async stop() {
        console.log('Stopping Base scraper')
        await this.page.close()
        await this.browser.close()
        this.browser = null
    }
}

module.exports = Base