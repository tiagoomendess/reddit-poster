'use strict'

const puppeteer = require('puppeteer')
const URL = `https://www.base.gov.pt/Base4/pt/pesquisa/?type=contratos&texto=&tipo=0&tipocontrato=0&cpv=&aqinfo=&adjudicante=&adjudicataria=&sel_price=price_c1&desdeprecocontrato=%E2%82%AC10.000%2C00&ateprecocontrato=&desdeprecoefectivo=&ateprecoefectivo=&desdeprazoexecucao=&ateprazoexecucao=&sel_date=date_c1&desdedatacontrato=&atedatacontrato=&desdedatapublicacao=&atedatapublicacao=&desdedatafecho=&atedatafecho=&pais=187&distrito=4&concelho=39`
const cheerio = require('cheerio')
const helpers = require('./helpers')

const MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const buildAggregateTitle = (date) => {
    return `Contratos públicos em Barcelos no mês de ${MONTHS_PT[date.getMonth()]} de ${date.getFullYear()}`
}

const formatDay = (date) => {
    return String(date.getDate()).padStart(2, '0')
}

const parsePublicationDate = (value) => {
    if (!value) return null

    if (value instanceof Date && !isNaN(value.getTime())) {
        return value
    }

    if (typeof value === 'number') {
        const date = new Date(value)
        return isNaN(date.getTime()) ? null : date
    }

    const text = String(value).trim()
    if (!text) return null

    const ddmmyyyy = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
    if (ddmmyyyy) {
        const date = new Date(Number(ddmmyyyy[3]), Number(ddmmyyyy[2]) - 1, Number(ddmmyyyy[1]))
        return isNaN(date.getTime()) ? null : date
    }

    const parsed = new Date(text)
    return isNaN(parsed.getTime()) ? null : parsed
}

const buildArticle = (contract, buildContractTitle) => {
    const publicationDate = parsePublicationDate(contract.publicationDate) || new Date()

    return {
        title: buildContractTitle(contract),
        url: contract.url,
        day: formatDay(publicationDate),
        aggregateUnderTitle: buildAggregateTitle(publicationDate),
        ignoreSimilarityCheck: true
    }
}

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

    buildContractTitle(item) {
        let object = item.object || '-'
        let price = (item.price || '-').split(',')[0].replace(/\./g, ' ')

        if (object.length > 103)
            object = object.slice(0, 100) + '...'

        return `${item.adjudicante} paga ${price} € a ${item.adjudicatario} para ${object} - ${item.procedimento}`
    }

    async run() {
        console.log("Checking Base for Contracts")
        await this.page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 })
        await helpers.wait(3000)

        const contracts = await this.page.evaluate(async () => {
            const response = await fetch('/Base4/pt/resultados/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                body: new URLSearchParams({
                    type: 'search_contratos',
                    version: '144.0',
                    query: 'tipo=0&tipocontrato=0&desdeprecocontrato=10000.00&pais=187&distrito=4&concelho=39',
                    sort: '-publicationDate',
                    page: '0',
                    size: '25'
                })
            })
            const text = await response.text()
            if (!text || text.trim() === 'null') return []

            const search = Function(`"use strict"; return (${text})`)()
            if (!search || !search.items) return []

            return search.items.map(item => ({
                procedimento: item.contractingProcedureType || '-',
                adjudicante: item.contracting || '-',
                adjudicatario: item.contracted || '-',
                object: item.objectBriefDescription || '-',
                price: item.initialContractualPrice || '-',
                publicationDate: item.publicationDate,
                url: `https://www.base.gov.pt/Base4/pt/detalhe/?type=contratos&id=${item.id}`
            }))
        })

        let articles = contracts.map(contract => buildArticle(contract, (c) => this.buildContractTitle(c)))

        if (articles.length === 0) {
            const bodyHandle = await this.page.$('body')
            let $ = cheerio.load(await this.page.evaluate(body => body.innerHTML, bodyHandle))
            $('tbody > tr').each((index, element) => {
                let procedimento = $(element).find('td[data-title="Tipo de procedimento"]').text().trim()
                let adjudicante = $(element).find('td[data-title="Adjudicante"]').text().trim()
                let adjucatario = $(element).find('td[data-title="Adjudicatário"]').text().trim()
                let object = $(element).find('td[data-title="Objeto do contrato"]').text().trim()
                let price = $(element).find('td[data-title="Preço contratual"]').text().trim()
                let publicationDate = $(element).find('td[data-title="Data de publicação"]').text().trim()
                let url = $(element).find('a').attr('href')
                if (!url) return

                articles.push(buildArticle({
                    procedimento,
                    adjudicante,
                    adjudicatario: adjucatario,
                    object,
                    price,
                    publicationDate,
                    url: url.includes('http') ? url : `https://www.base.gov.pt${url}`
                }, (c) => this.buildContractTitle(c)))
            })
        }

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