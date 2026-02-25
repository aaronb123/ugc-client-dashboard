import { NextResponse } from "next/server";

export async function GET() {
  try {
    const databaseId = process.env.NOTION_DATABASE_ID;
    const apiKey = process.env.NOTION_API_KEY;

    if (!databaseId || !apiKey) {
      return NextResponse.json({
        error: "Missing credentials",
        hasDatabaseId: !!databaseId,
        hasApiKey: !!apiKey,
      });
    }

    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page_size: 3 }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        error: "Notion API error",
        status: response.status,
        details: data,
      });
    }

    // Return raw data for first 3 results
    return NextResponse.json({
      totalResults: data.results.length,
      propertyNames: data.results[0]
        ? Object.keys(data.results[0].properties)
        : [],
      firstThreeResults: data.results.slice(0, 3).map((page: any) => ({
        id: page.id,
        properties: page.properties,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    });
  }
}
