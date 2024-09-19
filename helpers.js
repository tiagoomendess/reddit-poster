'use strict'

const HEADLESS = true;

const wait = async (ms) => {
    return new Promise(resolve => {
        setTimeout(() => { resolve() }, ms)
    })
}

module.exports = {
    wait,
    HEADLESS
}