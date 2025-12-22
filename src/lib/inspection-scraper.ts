import OpenAI from 'openai';
import puppeteer from 'puppeteer-core';
import type { ExtractedInspectionData } from '@/types/inspection';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Common Chrome executable paths
const CHROME_PATHS = {
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  ],
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ],
};

/**
 * Find Chrome executable path
 */
async function findChromePath(): Promise<string | null> {
  const platform = process.platform as 'linux' | 'win32' | 'darwin';
  const paths = CHROME_PATHS[platform] || CHROME_PATHS.linux;
  
  const fs = await import('fs');
  for (const chromePath of paths) {
    if (chromePath && fs.existsSync(chromePath)) {
      return chromePath;
    }
  }
  
  return null;
}

// Prompt for extracting inspection data from HTML content
const EXTRACTION_PROMPT = `You are analyzing a Chinese vehicle inspection report from Chaboshi (查博士).
I will provide you with HTML content from the inspection report page.

Extract the following information and return ONLY valid JSON (no markdown, no code blocks):

{
  "overallGrade": "string (single letter: A, B, C, D, or E)",
  "inspectionDate": "string or null (format: YYYY.MM.DD if found)",
  "accidentScore": "string or null (format: X/Y, e.g. '9/70')",
  "floodScore": "string or null (format: X/Y, e.g. '7/27')",
  "fireScore": "string or null (format: X/Y, e.g. '0/23')",
  "deepScore": "string or null (format: X/Y, e.g. '13/42')",
  "isAccidentCar": "boolean or null (true if 事故车, false if 非事故车/非事故)",
  "isFloodCar": "boolean or null (true if 泡水车, false if 非泡水车/非泡水)",
  "isFireCar": "boolean or null (true if 火烧车, false if 非火烧车/非火烧)"
}

Key Chinese terms to look for:
- 事故项 = Accident items
- 泡水项 = Flood items  
- 火烧项 = Fire items
- 深度项 = Deep inspection items
- 事故车 / 事故结论：事故车 = Accident vehicle (isAccidentCar = true)
- 非事故车 / 非事故 = Not accident vehicle (isAccidentCar = false)
- 泡水车 = Flood damaged (isFloodCar = true)
- 非泡水车 / 非泡水 = Not flood damaged (isFloodCar = false)
- 火烧车 = Fire damaged (isFireCar = true)
- 非火烧车 / 非火烧 = Not fire damaged (isFireCar = false)
- 检测时间 = Inspection date
- 级 = Grade (e.g., E级 = Grade E)

Look for patterns like "9/70" for scores.
Return ONLY the JSON object, no explanation.`;

/**
 * Custom error for network failures (e.g., Chinese API unreachable)
 */
export class InspectionFetchError extends Error {
  constructor(
    message: string,
    public readonly isNetworkError: boolean = false,
    public readonly isTimeout: boolean = false
  ) {
    super(message);
    this.name = 'InspectionFetchError';
  }
}

/**
 * Fetch rendered HTML content from URL using Puppeteer
 * This handles JavaScript-rendered pages like the Chaboshi inspection reports
 */
async function fetchPageContent(url: string): Promise<string> {
  const chromePath = await findChromePath();
  
  if (!chromePath) {
    throw new InspectionFetchError(
      'Chrome/Chromium not found. Please install Google Chrome to enable inspection report fetching.',
      false,
      false
    );
  }

  let browser;
  try {
    console.log('Launching browser for inspection report...');
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to inspection report page...');
    
    // Navigate and wait for network to be idle (Vue.js data loaded)
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait a bit more for Vue.js to finish rendering
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Additional wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Extracting page content...');
    
    // Get the rendered HTML
    const content = await page.content();
    
    return content;
  } catch (error) {
    console.error('Puppeteer error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        throw new InspectionFetchError(
          'Page load timed out. The inspection report server may be slow or unreachable.',
          true,
          true
        );
      }
      
      if (error.message.includes('net::ERR_') || error.message.includes('ECONNREFUSED')) {
        throw new InspectionFetchError(
          'Unable to connect to inspection report server. Network error occurred.',
          true,
          false
        );
      }
    }
    
    throw new InspectionFetchError(
      `Failed to fetch inspection report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      true,
      false
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Extract inspection data from HTML using OpenAI
 */
export async function extractInspectionData(
  htmlContent: string
): Promise<ExtractedInspectionData> {
  // Truncate HTML if too long (keep most relevant parts)
  const maxLength = 30000;
  let content = htmlContent;
  if (content.length > maxLength) {
    // Try to keep the body content
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    content = bodyMatch ? bodyMatch[1] : content.substring(0, maxLength);
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: EXTRACTION_PROMPT,
      },
      {
        role: 'user',
        content: `Here is the HTML content from a Chinese vehicle inspection report:\n\n${content}`,
      },
    ],
    max_tokens: 500,
    temperature: 0,
  });

  const responseContent = response.choices[0]?.message?.content;
  
  if (!responseContent) {
    throw new Error('No response from OpenAI API');
  }

  // Parse the JSON response
  try {
    // Try to extract JSON from the response (in case there's any extra text)
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const data = JSON.parse(jsonMatch[0]) as ExtractedInspectionData;
    return data;
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', responseContent);
    throw new Error(`Failed to parse inspection data: ${parseError}`);
  }
}

/**
 * Scrape and extract inspection report data from URL
 */
export async function scrapeInspectionReport(
  url: string
): Promise<{ data: ExtractedInspectionData; rawResponse: string }> {
  // Fetch HTML content
  const htmlContent = await fetchPageContent(url);
  
  // Extract data using OpenAI
  const data = await extractInspectionData(htmlContent);
  
  return {
    data,
    rawResponse: JSON.stringify(data),
  };
}

