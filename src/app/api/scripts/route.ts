import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export async function GET() {
  try {
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!databaseId) {
      return NextResponse.json(
        { error: "Database ID not configured" },
        { status: 500 }
      );
    }

    // Query the database for all pages
    const response = await (notion as any).databases.query({
      database_id: databaseId,
      sorts: [
        {
          timestamp: "created_time",
          direction: "descending",
        },
      ],
    });

    const scripts = response.results.map((page: any) => {
      const properties = page.properties;

      // Get the title - try common property names
      let title = "Untitled";
      const titleProp =
        properties.Name ||
        properties.Title ||
        properties["Script Name"] ||
        properties.name ||
        properties.title;

      if (titleProp?.title?.[0]?.plain_text) {
        title = titleProp.title[0].plain_text;
      }

      // Get the URL - try common property names
      let url = null;
      const urlProp =
        properties.URL ||
        properties.Link ||
        properties["Doc Link"] ||
        properties["Google Doc"] ||
        properties.url ||
        properties.link;

      if (urlProp?.url) {
        url = urlProp.url;
      }

      return {
        id: page.id,
        title,
        url,
        createdTime: page.created_time,
      };
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
