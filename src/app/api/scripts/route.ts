import { NextResponse } from "next/server";

// Primal Queen brand ID from Notion
const PRIMAL_QUEEN_BRAND_ID = "262c239d-6afc-80fe-8908-d8d9b395e7c5";

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
          page_size: 100,
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

        // Get the Concept Name (title field)
        let title = "Untitled";
        const conceptName = properties["Concept Name"];
        if (conceptName?.title?.[0]?.plain_text) {
          title = conceptName.title[0].plain_text;
        }

        // Get the Director's Script URL
        let url = null;
        const scriptProp = properties["Director's Script"];
        if (scriptProp?.url) {
          url = scriptProp.url;
        }

        // Get the Concept Type (formula field - returns "UGC", "High Production", etc.)
        let conceptType = "";
        const conceptTypeProp = properties["Concept Type"];
        if (conceptTypeProp?.formula?.string) {
          conceptType = conceptTypeProp.formula.string;
        }

        // Get the Brand relation IDs
        const brandIds: string[] = [];
        const brandProp = properties["Brand"];
        if (brandProp?.relation) {
          for (const rel of brandProp.relation) {
            brandIds.push(rel.id);
          }
        }

        // Get the Batch (select field)
        let batch = "";
        const batchProp = properties["Batch"];
        if (batchProp?.select?.name) {
          batch = batchProp.select.name;
        }

        return {
          id: page.id,
          title,
          url,
          conceptType,
          brandIds,
          batch,
          createdTime: page.created_time,
        };
      })
      // Filter: UGC, Primal Queen brand, NOT Batch 11, has Director's Script
      .filter((script: any) => {
        const isUGC = script.conceptType === "UGC";
        const isPrimalQueen = script.brandIds.includes(PRIMAL_QUEEN_BRAND_ID);
        const isNotBatch11 = script.batch !== "Batch 11";
        const hasLink = !!script.url;

        return isUGC && isPrimalQueen && isNotBatch11 && hasLink;
      })
      // Only return needed fields
      .map((script: any) => ({
        id: script.id,
        title: script.title,
        url: script.url,
        batch: script.batch,
      }));

    return NextResponse.json({ scripts });
  } catch (error: any) {
    console.error("Notion API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch scripts" },
      { status: 500 }
    );
  }
}
