'use strict'

require('dotenv').config();

const POSTED_URLS_FILE = 'posted.txt'
const POSTED_TITLES_FILE = 'posted_titles.txt'
const SIMILARITY_THRESHOLD = 0.33
const MAX_TITLES_TO_COMPARE = 50
const helpers = require('./helpers')
const OMinho = require('./ominho')
const fs = require('fs');
const JN = require('./jn');
const CMBarcelos = require('./cmbarcelos');
const DomingoAsDez = require('./domingoasdez')
const Base = require('./base')
const DiarioDoMinho = require('./diariominho')
const E24 = require('./e24')
const RedditApi = require('./reddit_api')
const GilVicente = require('./gilvicente')

console.log(`Starting BOT`)

if (!fs.existsSync(POSTED_TITLES_FILE)) {
    fs.writeFileSync(POSTED_TITLES_FILE, '')
}

let posted = fs.readFileSync(POSTED_URLS_FILE).toString().split("\r\n").filter(line => line.trim() !== '')
let postedTitles = fs.readFileSync(POSTED_TITLES_FILE).toString().split("\r\n").filter(line => line.trim() !== '').slice(-MAX_TITLES_TO_COMPARE)
console.log(`Loaded ${posted.length} links that were already posted`)
console.log(`Loaded ${postedTitles.length} recent titles for similarity check (last ${MAX_TITLES_TO_COMPARE})`)

const similarAlreadyPosted = (title) => {
    const cleanedTitle = helpers.cleanTitle(title)

    for (let i = 0; i < postedTitles.length; i++) {
        const similarity = helpers.jaccardSimilarity(cleanedTitle, postedTitles[i])
        if (similarity >= SIMILARITY_THRESHOLD) {
            console.log(`Ignoring "${cleanedTitle}" because it is similar (${similarity.toFixed(2)}) to a posted article: "${postedTitles[i]}"`)
            return true
        }
    }

    return false
}

const postArticles = async (articles) => {
    let redditApi = new RedditApi(
        process.env.REDDIT_APP_ID || 'app_id',
        process.env.REDDIT_SECRET || 'secret',
        process.env.REDDIT_USERNAME || 'user',
        process.env.REDDIT_PASSWORD ||'password'
    )

    let successes = 0
    let ignored = 0
    let failed = 0

    for(let i = 0; i < articles.length; i++) {
        if (posted.includes(articles[i].url)) {
            ignored++
            continue
        }

        const title = helpers.cleanTitle(articles[i].title)

        if (similarAlreadyPosted(title)) {
            ignored++
            continue
        }

        console.log(`Posting «${title}» | ${articles[i].url}`)

        await helpers.wait(1000) // Wait 1 second before posting, no spamming
        let success = await redditApi.submitLink('barcelos', title, articles[i].url)
        if (success) {
            successes++
            posted.push(articles[i].url)
            postedTitles.push(title)
            if (postedTitles.length > MAX_TITLES_TO_COMPARE) {
                postedTitles.shift()
            }
            fs.appendFileSync(POSTED_URLS_FILE, `\r\n${articles[i].url}`)
            fs.appendFileSync(POSTED_TITLES_FILE, `\r\n${title}`)
        } else {
            failed++
            console.log(`Could not post article...`)
        }
    }

    console.log(`Posted ${successes} links, ignored ${ignored} and ${failed} failed, out of ${articles.length} articles found.`)
}

const run = async () => {

    let ominho = new OMinho()
    let jn = new JN()
    let cmbarcelos = new CMBarcelos()
    let domingoasdez = new DomingoAsDez()
    let base = new Base()
    let diariodominho = new DiarioDoMinho()
    let e24 = new E24()
    let gilVicente = new GilVicente()

    // Run the thing
    let articles = []

    console.log("\n--- Preparing browsers ------------- \n")

    await Promise.all([
        ominho.init().catch(),
        jn.init().catch(),
        cmbarcelos.init().catch(),
        domingoasdez.init().catch(),
        base.init().catch(),
        diariodominho.init().catch(),
        e24.init().catch(),
        gilVicente.init().catch()
    ])

    while(true) {
        console.log("\n--- All browsers are ready ------------- \n")

        articles = await ominho.run().catch(e => {
            console.error(`Error checking OMinho: ${e}`)
            return []
        })

        articles = articles.concat(await jn.run().catch(e => {
            console.error(`Error checking JN: ${e}`)
            return []
        }))

        articles = articles.concat(await cmbarcelos.run().catch(e => {
            console.error(`Error checking CMBarcelos: ${e}`)
            return []
        }))

        articles = articles.concat(await domingoasdez.run().catch(e => {
            console.error(`Error checking DomingoAsDez: ${e}`)
            return []
        }))

        articles = articles.concat(await base.run().catch(e => {
            console.error(`Error checking Base: ${e}`)
            return []
        }))

        articles = articles.concat(await diariodominho.run().catch(e => {
            console.error(`Error checking Diario do Minho: ${e}`)
            return []
        }))

        articles = articles.concat(await e24.run().catch(e => {
            console.error(`Error checking E24: ${e}`)
            return []
        }))

        articles = articles.concat(await gilVicente.run().catch(e => {
            console.error(`Error checking GilVicente: ${e}`)
            return []
        }))

        console.log("\n--- All websites scraped ------------- \n")

        console.log(`Found ${articles.length} articles to post`)

        // Post everything
        await postArticles(articles).catch(e => {
            console.error(`Error trying to post to Reddit: ${e}`)
        })

        console.log("Every website done, waiting...")
        await helpers.wait(600000)
        console.log("--- End of Wait -----------------------")
    }
}

run()
