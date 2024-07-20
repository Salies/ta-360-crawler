import puppeteer from 'puppeteer-extra';
import { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } from 'puppeteer';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import fs from 'fs';

puppeteer.use(
  AdblockerPlugin({
    interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY
  })
)

const browser = await puppeteer.launch({
  headless:false
});
const page = await browser.newPage();

let allGames = [];
for (let pageNumber = 1; pageNumber < 18; pageNumber++) {
  console.log(pageNumber);
  await page.goto(`https://www.trueachievements.com/not-backwards-compatible/games?page=${pageNumber}`);
  let elements = await page.$$('#oGameList > tbody > tr');
  elements.shift();
  for (const element of elements) {
    let gameUrl = await element.$('.game > a');
    let gameUrlHref = await gameUrl.evaluate(node => node.href);
    let gameName = await gameUrl.evaluate(node => node.innerText);
    let gameScore = await element.$('.score');
    let gameScoreTxt = await gameScore.evaluate(node => node.innerText);
    gameScoreTxt = gameScoreTxt.replace(/\n/g, ' ');
    let gameScoreArr = gameScoreTxt.split(' ');
    let taScore = gameScoreArr[0];
    let gamerscore = gameScoreArr[1];
    // replace ( and ) with '' in gamerscore
    gamerscore = gamerscore.replace('(', '');
    gamerscore = gamerscore.replace(')', '');
    // replace , with '' in both
    taScore = taScore.replace(',', '');
    gamerscore = gamerscore.replace(',', '');
    // to int
    taScore = parseInt(taScore);
    gamerscore = parseInt(gamerscore);
    // pctComplete = td:nth-child(6)
    let pctComplete = await element.$('td:nth-child(6)');
    let pctCompleteTxt = await pctComplete.evaluate(node => node.innerText);
    // parseFloat
    pctCompleteTxt = parseFloat(pctCompleteTxt);
    let gameObj = {
      name: gameName,
      taScore: taScore,
      gamerscore: gamerscore,
      url: gameUrlHref,
      pctComplete: pctCompleteTxt
    };
    allGames.push(gameObj);
  }
}

await browser.close();

fs.writeFileSync('data/allGames.json', JSON.stringify(allGames, null, 2));