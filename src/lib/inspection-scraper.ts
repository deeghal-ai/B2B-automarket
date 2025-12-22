import OpenAI from 'openai';
import type { ExtractedInspectionData } from '@/types/inspection';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
 * Fetch HTML content from URL
 */
async function fetchPageContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
  }

  return response.text();
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

