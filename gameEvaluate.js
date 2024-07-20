import puppeteer from 'puppeteer-extra';
import { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } from 'puppeteer';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import Database from 'better-sqlite3';
import fs from 'fs';

puppeteer.use(
  AdblockerPlugin({
    interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY
  })
)

const mediumMap = {
    'Digital only': "digital",
    'Physical only': "physical",
    'Physical and Digital': "both"
}

function gameConstructor(name, taScore, gamerscore, url, pctComplete, medium, delisted, achievements, nAchievementsDiscontinued, brazil) {
    const game = {
        name: name,
        taScore: taScore,
        gamerscore: gamerscore,
        taRatio: Math.round((taScore / gamerscore) * 100) / 100,
        url: url,
        pctComplete: pctComplete,
        medium: medium,
        delisted: delisted,
        achievements: achievements,
        discontinued: nAchievementsDiscontinued,
        hasAchievementsStill: achievements > nAchievementsDiscontinued ? 1: 0,
        liveBrazil: brazil
    };
    return game;
}

const delay = ms => new Promise(res => setTimeout(res, ms));

// open data/allGames.json
const allGames = JSON.parse(fs.readFileSync('data/allGames.json', 'utf8'));

const browser = await puppeteer.launch({
  headless:false
});

const page = await browser.newPage();

for (const game of allGames) {
    await page.goto(game.url);

    // get warning panels
    const wPanels = await page.$$('.warningspanel');
    const wPanelsContent = await Promise.all(wPanels.map(async panel => {
        return await panel.evaluate(node => node.innerText);
    }));

    let delisted = false;
    let nDiscontinued = 0;
    for (const panel of wPanelsContent) {
        if (panel.includes('This game has been removed from the Microsoft Store')) {
            delisted = true;
        }
        if (panel.toLowerCase().includes('discontinued')) {
            const dPanel = panel.split(' ');
            nDiscontinued = parseInt(dPanel[3]);
        }
    }

    // get content of #frm > div.page.ta > div.main.middle > main > div.pnl-hd.no-pills.game > div.info > div.l.l1 > div:nth-child(3) > span
    const achCount = await page.$('#frm > div.page.ta > div.main.middle > main > div.pnl-hd.no-pills.game > div.info > div.l.l1 > div:nth-child(3) > span');
    let nAchievements = 0;
    if (achCount !== null) {
        const achCountTxt = await achCount.evaluate(node => node.innerText);
        nAchievements = parseInt(achCountTxt);
    }

    // get content of #frm > div.page.ta > div.main.middle > aside > section.blue.content-options > article > div:nth-child(2) > div > div > div.price > span
    const gamePrice = await page.$('#frm > div.page.ta > div.main.middle > aside > section.blue.content-options > article > div:nth-child(2) > div > div > div.price > span');
    let inBrazil = false;
    if (gamePrice !== null) {
        const gamePriceTxt = await gamePrice.evaluate(node => node.innerText);
        if (gamePriceTxt.includes('R$')) {
            inBrazil = true;
        }
    }

    // get content of #frm > div.page.ta > div.main.middle > aside > section.navy.gameinfo > article > dl > dd:nth-child(14)
    const gameMedium = await page.$('#frm > div.page.ta > div.main.middle > aside > section.navy.gameinfo > article > dl > dd:nth-child(14)');
    const gameMediumTxt = await gameMedium.evaluate(node => node.innerText);
    const medium = mediumMap[gameMediumTxt];

    const gameObj = gameConstructor(
        game.name,
        game.taScore,
        game.gamerscore,
        game.url,
        game.pctComplete,
        medium,
        delisted,
        nAchievements,
        nDiscontinued,
        inBrazil
    );

    console.log(gameObj);

    // save gameObj to database

    break;
}

/*const gamePageTest = 'https://www.trueachievements.com/game/Abyss-Odyssey/achievements';
//const gamePageTest = 'https://www.trueachievements.com/game/1-vs-100/achievements';
await page.goto(gamePageTest);

// get warning panels
const wPanels = await page.$$('.warningspanel');
const wPanelsContent = await Promise.all(wPanels.map(async panel => {
    return await panel.evaluate(node => node.innerText);
}));

let delisted = false;
let nDiscontinued = 0;
for (const panel of wPanelsContent) {
    if (panel.includes('This game has been removed from the Microsoft Store')) {
        delisted = true;
    }
    if (panel.toLowerCase().includes('discontinued')) {
        const dPanel = panel.split(' ');
        nDiscontinued = parseInt(dPanel[3]);
    }
}

console.log(delisted, nDiscontinued);

// get content of #frm > div.page.ta > div.main.middle > main > div.pnl-hd.no-pills.game > div.info > div.l.l1 > div:nth-child(3) > span
const achCount = await page.$('#frm > div.page.ta > div.main.middle > main > div.pnl-hd.no-pills.game > div.info > div.l.l1 > div:nth-child(3) > span');
let nAchievements = 0;
if (achCount !== null) {
    const achCountTxt = await achCount.evaluate(node => node.innerText);
    nAchievements = parseInt(achCountTxt);
}

console.log(nAchievements);

// get content of #frm > div.page.ta > div.main.middle > aside > section.blue.content-options > article > div:nth-child(2) > div > div > div.price > span
const gamePrice = await page.$('#frm > div.page.ta > div.main.middle > aside > section.blue.content-options > article > div:nth-child(2) > div > div > div.price > span');
let inBrazil = false;
if (gamePrice !== null) {
    const gamePriceTxt = await gamePrice.evaluate(node => node.innerText);
    if (gamePriceTxt.includes('R$')) {
        inBrazil = true;
    }
}

console.log(inBrazil);

// get content of #frm > div.page.ta > div.main.middle > aside > section.navy.gameinfo > article > dl > dd:nth-child(14)
const gameMedium = await page.$('#frm > div.page.ta > div.main.middle > aside > section.navy.gameinfo > article > dl > dd:nth-child(14)');
const gameMediumTxt = await gameMedium.evaluate(node => node.innerText);
const medium = mediumMap[gameMediumTxt];

console.log(medium);

const gameObj = gameConstructor(
    sampleGame.name,
    sampleGame.taScore,
    sampleGame.gamerscore,
    sampleGame.url,
    sampleGame.pctComplete,
    medium,
    delisted,
    nAchievements,
    nDiscontinued,
    inBrazil
);

console.log(gameObj);

await browser.close();*/

/*const db = new Database('data/games.db');
db.pragma('journal_mode = WAL');

db.exec('CREATE TABLE IF NOT EXISTS games (name TEXT, taScore INTEGER, gamerscore INTEGER, taRatio REAL, url TEXT, pctComplete REAL, medium TEXT, delisted BOOLEAN, achievements INTEGER, discontinued INTEGER, hasAchievementsStill BOOLEAN, liveBrazil BOOLEAN)');
db.exec('CREATE INDEX IF NOT EXISTS idx_games_name ON games (name)');

const testGame = gameConstructor('teste', 2.5, 1, 'aaa', 0.5, 'digital', 0, 10, 9, 0);

const stmt = db.prepare('INSERT INTO games (name, taScore, gamerscore, taRatio, url, pctComplete, medium, delisted, achievements, discontinued, hasAchievementsStill, liveBrazil) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
stmt.run(testGame.name, testGame.taScore, testGame.gamerscore, testGame.taRatio, testGame.url, testGame.pctComplete, testGame.medium, testGame.delisted, testGame.achievements, testGame.discontinued, testGame.hasAchievementsStill, testGame.liveBrazil);*/

