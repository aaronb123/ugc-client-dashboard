import { NextResponse } from "next/server";

const PRIMAL_QUEEN_BRAND_ID = "262c239d-6afc-80fe-8908-d8d9b395e7c5";

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
        body: JSON.stringify({ page_size: 20 }),
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

    // Extract and analyze each result
    const analyzed = data.results.map((page: any) => {
      const properties = page.properties;

      // Get title
      let title = "Untitled";
      const conceptName = properties["Concept Name"];
      if (conceptName?.title?.[0]?.plain_text) {
        title = conceptName.title[0].plain_text;
      }

      // Get Director's Script URL
      let url = null;
      const scriptProp = properties["Director's Script"];
      if (scriptProp?.url) {
        url = scriptProp.url;
      }

      // Get Concept Type
      let conceptType = "";
      const conceptTypeProp = properties["Concept Type"];
      if (conceptTypeProp?.formula?.string) {
        conceptType = conceptTypeProp.formula.string;
      }

      // Get Brand IDs
      const brandIds: string[] = [];
      const brandProp = properties["Brand"];
      if (brandProp?.relation) {
        for (const rel of brandProp.relation) {
          brandIds.push(rel.id);
        }
      }

      // Get Batch
      let batch = "";
      const batchProp = properties["Batch"];
      if (batchProp?.select?.name) {
        batch = batchProp.select.name;
      }

      // Check filters
      const isUGC = conceptType === "UGC";
      const isPrimalQueen = brandIds.includes(PRIMAL_QUEEN_BRAND_ID);
      const isNotBatch11 = batch !== "Batch 11";
      const hasLink = !!url;
      const passesAllFilters = isUGC && isPrimalQueen && isNotBatch11 && hasLink;

      return {
        title,
        conceptType,
        brandIds,
        batch,
        hasLink,
        filters: {
          isUGC,
          isPrimalQueen,
          isNotBatch11,
          hasLink,
          passesAllFilters,
        },
      };
    });

    const passing = analyzed.filter((a: any) => a.filters.passesAllFilters);

    return NextResponse.json({
      totalResults: data.results.length,
      passingFilters: passing.length,
      primalQueenBrandId: PRIMAL_QUEEN_BRAND_ID,
      analyzed,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    });
  }
}
