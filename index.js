'use strict'

require('dotenv').config();

const helpers = require('./helpers')
const OMinho = require('./ominho')
const JN = require('./jn');
const CMBarcelos = require('./cmbarcelos');
const DomingoAsDez = require('./domingoasdez')
const Base = require('./base')
const DiarioDoMinho = require('./diariominho')
const E24 = require('./e24')
const Poster = require('./poster')
const GilVicente = require('./gilvicente')

console.log(`Starting BOT`)

const poster = new Poster()

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

        await poster.postArticles(articles).catch(e => {
            console.error(`Error trying to post to Reddit: ${e}`)
        })

        console.log("Every website done, waiting...")
        await helpers.wait(600000)
        console.log("--- End of Wait -----------------------")
    }
}

run()
