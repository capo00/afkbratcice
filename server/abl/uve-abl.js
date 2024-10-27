const OcAppCore = require("../libs/oc_app-core");
const puppeteer = require('puppeteer');

const ERROR_CODE_PREFIX = "oc_afkbratcice";
const UveError = {

  GetFailed: class extends OcAppCore.AppError.Failed {
    constructor(name, e, opts) {
      const code = [ERROR_CODE_PREFIX, name, "getFailed"].join("/");
      super(`Getting of ${name} was failed`, { cause: e, code, ...opts });
    }
  },
}

async function fetchRenderedHTML(url) {
  // Launch a headless browser
  const browser = await puppeteer.launch();

  // Open a new page
  const page = await browser.newPage();

  // Navigate to the URL
  await page.goto(url, { waitUntil: 'networkidle2' }); // Wait until network is idle

  // Optionally wait for a specific selector to ensure complete rendering
  await page.waitForSelector('.js-matchRoundSection');

  // Get the HTML content of the page
  const htmlContent = await page.content();

  // Close the browser
  await browser.close();

  return htmlContent;
}

class UveAbl {

  constructor() {
    this.name = "uve";
  }

  async get(uri) {
    return {
      html: await fetchRenderedHTML(uri),
    };
  }
}

UveAbl.Error = UveError;

module.exports = new UveAbl();

