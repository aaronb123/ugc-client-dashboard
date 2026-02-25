import { NextResponse } from "next/server";

export async function GET() {
  try {
    const databaseId = process.env.NOTION_DATABASE_ID;
    const apiKey = process.env.NOTION_API_KEY;

    if (!databaseId || !apiKey) {
      return NextResponse.json(
        { error: "Notion credentials not configured" },
        { status: 500 }
      );
    }

    // Query the Notion database directly via API
    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sorts: [
            {
              timestamp: "created_time",
              direction: "descending",
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Notion API error:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch from Notion" },
        { status: response.status }
      );
    }

    const data = await response.json();

    const scripts = data.results
      .map((page: any) => {
        const properties = page.properties;

        // Get the Concept Name
        let title = "Untitled";
        const titleProp =
          properties["Concept Name"] ||
          properties.Name ||
          properties.Title ||
          properties.name;

        if (titleProp?.title?.[0]?.plain_text) {
          title = titleProp.title[0].plain_text;
        } else if (titleProp?.rich_text?.[0]?.plain_text) {
          title = titleProp.rich_text[0].plain_text;
        }

        // Get the Director's Script URL
        let url = null;
        const urlProp = properties["Director's Script"];

        if (urlProp?.url) {
          url = urlProp.url;
        }

        return {
          id: page.id,
          title,
          url,
          createdTime: page.created_time,
        };
      })
      // Only show scripts with "UGC" in the name AND have a Director's Script link
      .filter((script: any) =>
        script.title.toUpperCase().includes("UGC") && script.url
      );

    return NextResponse.json({ scripts });
  } catch (error: any) {
    console.error("Notion API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch scripts" },
      { status: 500 }
    );
  }
}
