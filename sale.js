import puppeteer from 'puppeteer';
import fs from 'fs';

// https://news.xbox.com/en-us/2024/05/14/xbox-360-price-reductions-available-now/

const browser = await puppeteer.launch();

const page = await browser.newPage();

await page.goto('https://news.xbox.com/en-us/2024/05/14/xbox-360-price-reductions-available-now/');

let games = [];
const btnsSelector = 'span > .paginate_button';
for(let i = 0; i < 4; i++) {
    // get all buttons
    // if this is outside, it will not work
    const btns = await page.$$(btnsSelector);
    await btns[i].click();

    // get all tbody > tr
    const trs = await page.$$('tbody > tr');
    for(const tr of trs) {
        const tds = await tr.$$('td');
        const a = await tds[0].$('a');
        // gameName = a innerText
        const gameName = await a.evaluate(node => node.innerText);
        const gameUrl = await a.evaluate(node => node.href);
        const contentType = await tds[1].evaluate(node => node.innerText);
        const discount = await tds[2].evaluate(node => node.innerText);
        games.push({gameName, gameUrl, contentType, discount});
    }
}

await browser.close();

// save to json
fs.writeFileSync('data/sale.json', JSON.stringify(games, null, 4));