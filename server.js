import express from "express";
import fs from "fs";
import { scrapeG2Reviews } from "./g2Scraper.js";

const app = express();
const PORT = process.env.port || 3000;

// Load mock data once at startup
const reviewsData = JSON.parse(fs.readFileSync("mock-reviews.json", "utf8"));

// Helper to check if date is in range
function inRange(dateStr, start, end) {
  const d = new Date(dateStr);
  return d >= new Date(start) && d <= new Date(end);
}

app.get("/reviews", (req, res) => {
  const { company, start, end, source = "all" } = req.query;

  // Validate inputs
  if (!company || !start || !end) {
    return res.status(400).json({
      error: "Missing required query params: company, start, end"
    });
  }

  // If source = "all" → match all sources
  let allowedSources;
  if (source.toLowerCase() === "all") {
    allowedSources = ["g2", "capterra", "getapp"];
  } else {
    allowedSources = source.split(",").map(s => s.trim().toLowerCase());
  }

  // Filter reviews
  let filtered = reviewsData.filter(r => 
    r.company.toLowerCase() === company.toLowerCase() &&
    inRange(r.date, start, end) &&
    allowedSources.includes(r.source.toLowerCase())
  );

  // Sort by newest first
  filtered.sort((a, b) => b.date.localeCompare(a.date));

  res.json({
    company,
    start,
    end,
    source: allowedSources,
    count: filtered.length,
    reviews: filtered
  });
});
//Tried to scrape data using Pupenteers
app.get("/g2-reviews", async (req, res) => {
  try {
    const { url, start, end } = req.query;
    if (!url || !start || !end) {
      return res.status(400).json({ error: "Missing required query params: url, start, end" });
    }

    const data = await scrapeG2Reviews(url, start, end);
    res.json({ count: data.length, reviews: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Scraping failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Mock Reviews API running on http://localhost:${PORT}`);
});
