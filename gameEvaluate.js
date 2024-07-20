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

// utility function
const delay = ms => new Promise(res => setTimeout(res, ms));

// create db
const db = new Database('data/games.db');
db.pragma('journal_mode = WAL');

db.exec('CREATE TABLE IF NOT EXISTS games (name TEXT, taScore INTEGER, gamerscore INTEGER, taRatio REAL, url TEXT, pctComplete REAL, medium TEXT, delisted BOOLEAN, achievements INTEGER, discontinued INTEGER, hasAchievementsStill BOOLEAN, liveBrazil BOOLEAN)');
// index to verify a game's existence faster
db.exec('CREATE INDEX IF NOT EXISTS idx_games_name ON games (name)');

// open data/allGames.json
const allGames = JSON.parse(fs.readFileSync('data/allGames.json', 'utf8'));
const gameCount = allGames.length;

const browser = await puppeteer.launch();

const page = await browser.newPage();

let i = 1;
for (const game of allGames) {
    console.log(`Processing game ${i}/${gameCount}: ${game.name}`);
    const stmtCheck = db.prepare('SELECT COUNT(*) FROM games WHERE name = ?');
    const count = stmtCheck.get(game.name)['COUNT(*)'];
    if (count !== 0) {
        console.log('Game already in database, skipping');
        i++;
        continue;
    }

    await page.goto(game.url);

    // get warning panels
    const wPanels = await page.$$('.warningspanel');
    const wPanelsContent = await Promise.all(wPanels.map(async panel => {
        return await panel.evaluate(node => node.innerText);
    }));

    let delisted = 0;
    let nDiscontinued = 0;
    for (const panel of wPanelsContent) {
        if (panel.includes('This game has been removed from the Microsoft Store')) {
            delisted = 1;
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

    // WARNING TODO: BROKEN
    // get content of #frm > div.page.ta > div.main.middle > aside > section.blue.content-options > article > div:nth-child(2) > div > div > div.price > span
    const gamePrice = await page.$('#frm > div.page.ta > div.main.middle > aside > section.blue.content-options > article > div:nth-child(2) > div > div > div.price > span');
    let inBrazil = false;
    if (gamePrice !== null) {
        const gamePriceTxt = await gamePrice.evaluate(node => node.innerText);
        console.log(gamePriceTxt);
        if (gamePriceTxt.includes('R$')) {
            inBrazil = true;
        }
    }

    // get content of #frm > div.page.ta > div.main.middle > aside > section.navy.gameinfo > article > dl > dd:nth-child(14)
    const gameMedium = await page.$('#frm > div.page.ta > div.main.middle > aside > section.navy.gameinfo > article > dl > dd:nth-child(14)');
    if (gameMedium === null) {
        console.log('Could not find medium for game. Adding blank properties.');
        const gameObj = gameConstructor(
            game.name,
            0,
            0,
            game.url,
            0,
            "unknown",
            0,
            0,
            0,
            0
        );

        const stmt = db.prepare('INSERT INTO games (name, taScore, gamerscore, taRatio, url, pctComplete, medium, delisted, achievements, discontinued, hasAchievementsStill, liveBrazil) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        stmt.run(gameObj.name, gameObj.taScore, gameObj.gamerscore, gameObj.taRatio, gameObj.url, gameObj.pctComplete, gameObj.medium, gameObj.delisted, gameObj.achievements, gameObj.discontinued, gameObj.hasAchievementsStill, gameObj.liveBrazil);

        i++;
        await delay(500);

        continue;
    }

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

    const stmt = db.prepare('INSERT INTO games (name, taScore, gamerscore, taRatio, url, pctComplete, medium, delisted, achievements, discontinued, hasAchievementsStill, liveBrazil) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(gameObj.name, gameObj.taScore, gameObj.gamerscore, gameObj.taRatio, gameObj.url, gameObj.pctComplete, gameObj.medium, gameObj.delisted, gameObj.achievements, gameObj.discontinued, gameObj.hasAchievementsStill, gameObj.liveBrazil);
    
    i++;
    await delay(500);
    break;
}

db.close();

await browser.close();