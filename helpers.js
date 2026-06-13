'use strict'

const cheerio = require('cheerio')

const HEADLESS = true;

const wait = async (ms) => {
    return new Promise(resolve => {
        setTimeout(() => { resolve() }, ms)
    })
}

const cleanTitle = (title) => {
    if (!title) return ''

    const decoded = cheerio.load(`<span>${title}</span>`, null, false)('span').text()

    return decoded
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300)
}

const titleWords = (title) => {
    return cleanTitle(title)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter(word => word.length > 0)
}

const jaccardSimilarity = (titleA, titleB) => {
    const wordsA = new Set(titleWords(titleA))
    const wordsB = new Set(titleWords(titleB))

    if (wordsA.size === 0 || wordsB.size === 0) {
        return 0
    }

    let intersection = 0
    for (const word of wordsA) {
        if (wordsB.has(word)) {
            intersection++
        }
    }

    const union = wordsA.size + wordsB.size - intersection
    return intersection / union
}

module.exports = {
    wait,
    HEADLESS,
    cleanTitle,
    jaccardSimilarity
}