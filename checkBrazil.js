import puppeteer from 'puppeteer';
import fs from 'fs';

// open json file
const data = fs.readFileSync('data/sale.json');
const games = JSON.parse(data);

// utility function
const delay = ms => new Promise(res => setTimeout(res, ms));

const browser = await puppeteer.launch();

const page = await browser.newPage();

let gamesChecked = [];
let i = 1;
const total = games.length;
for (const game of games) {
    console.log(`Checking game ${i}/${total}.`);
    // gameUrl like: https://marketplace.xbox.com/en-US/Product/66ACD000-77FE-1000-9115-D802555308D0
    // replace en-US with pt-BR
    const gameUrl = game.gameUrl.replace('en-US', 'pt-BR');
    await page.goto(gameUrl);
    let gameChecked = {...game};
    // document.querySelector('.NotFound')
    const notFound = await page.$('.NotFound');
    if (notFound) {
        gamesChecked.push(gameChecked);
        console.log('Não tem no Brasil:', game.gameName);
        i++;
        continue;
    }
    // check for RelatedGameIcon
    const relatedGameIcon = await page.$('.RelatedGameIcon');
    if (!relatedGameIcon) {
        gamesChecked.push(gameChecked);
        console.log('Não tem no Brasil:', game.gameName);
        i++;
        continue;
    }
    // se tiver game icon, então tem no Brasil. muda a URL
    gameChecked.gameUrl = gameUrl;
    gamesChecked.push(gameChecked);

    i++;

    await delay(500);
}

await browser.close();

fs.writeFileSync('data/saleChecked.json', JSON.stringify(gamesChecked, null, 4));