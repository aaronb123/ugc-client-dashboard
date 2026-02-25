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

    // Debug: log first result's properties
    if (data.results.length > 0) {
      console.log("Property names:", Object.keys(data.results[0].properties));
    }

    const scripts = data.results
      .map((page: any) => {
        const properties = page.properties;

        // Get the Concept Name - check multiple possible property types
        let title = "Untitled";
        const conceptName = properties["Concept Name"];

        if (conceptName?.title?.[0]?.plain_text) {
          title = conceptName.title[0].plain_text;
        } else if (conceptName?.rich_text?.[0]?.plain_text) {
          title = conceptName.rich_text[0].plain_text;
        } else {
          // Fallback: find any title-type property
          for (const key of Object.keys(properties)) {
            const prop = properties[key];
            if (prop?.title?.[0]?.plain_text) {
              title = prop.title[0].plain_text;
              break;
            }
          }
        }

        // Get the Director's Script URL
        let url = null;
        const scriptProp = properties["Director's Script"];

        if (scriptProp?.url) {
          url = scriptProp.url;
        } else if (scriptProp?.rich_text?.[0]?.plain_text) {
          // Sometimes URLs are stored as rich_text
          const text = scriptProp.rich_text[0].plain_text;
          if (text.startsWith("http")) {
            url = text;
          }
        }

        return {
          id: page.id,
          title,
          url,
          createdTime: page.created_time,
        };
      })
      // Filter: UGC scripts, Primal Queen (PQ), NOT Batch 11, with Director's Script link
      .filter((script: any) => {
        const name = script.title.toUpperCase();
        const isUGC = name.includes("UGC");
        const isPrimalQueen = name.includes("PQ");
        const isNotBatch11 = !name.includes("PQ11");
        const hasLink = !!script.url;

        return isUGC && isPrimalQueen && isNotBatch11 && hasLink;
      });

    return NextResponse.json({ scripts });
  } catch (error: any) {
    console.error("Notion API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch scripts" },
      { status: 500 }
    );
  }
}
