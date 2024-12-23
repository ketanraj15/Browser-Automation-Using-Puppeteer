const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

// Use the stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

const run = async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        ignoreDefaultArgs: ["--enable-automation"]
    });

    const page = await browser.newPage();
    const url = process.argv[2]; // Read the URL passed as a command-line argument
    let result = null;

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' }); // Open YouTube video URL

        // Close cookie banner if it exists
        await page.evaluate(() => {
            document.querySelector('button[aria-label*=cookies]')?.click();
        });

        // Wait for and click the "Show transcript" button
        await page.waitForSelector("ytd-video-description-transcript-section-renderer button", {
            timeout: 10_000
        });
        await page.evaluate(() => {
            document.querySelector('ytd-video-description-transcript-section-renderer button').click();
        });

        // Parse the transcript
        result = await parseTranscript(page);

        // Save the transcript to a file
        const fileName = 'transcript.txt';
        fs.writeFileSync(fileName, result);
        console.log(`Transcript saved to ${fileName}`);
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await page.close();
        await browser.close();
    }
};

// Function to parse the transcript
const parseTranscript = async (page) => {
    await page.waitForSelector('#segments-container', { timeout: 10_000 }); // Wait for the transcript container

    return page.evaluate(() => {
        return Array.from(
            document.querySelectorAll('#segments-container yt-formatted-string')
        )
            .map((element) => element.textContent?.trim())
            .join("\n");
    });
};

run();
