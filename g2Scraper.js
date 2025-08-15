import express from "express";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { format } from "date-fns";

puppeteer.use(StealthPlugin());

const app = express();
const PORT = 3000;

// Universal wait function
async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeAllG2Reviews(productUrl, startDate, endDate) {
  console.log(" Starting G2 scraping...");
  console.log(` Date range: ${startDate} → ${endDate}`);
  console.log(` Product URL: ${productUrl}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
" Chrome/115 "
  );
  console.log(" Browser launched with stealth mode.");

  let allReviews = new Map(); // avoid duplicates
  let cursor = null;
  let keepFetching = true;
  let pageCount = 0;

  while (keepFetching) {
    pageCount++;
    let pageData = [];

    console.log(`\n Fetching page #${pageCount}...`);

    // Listener for GraphQL responses
    const graphqlListener = async (response) => {
      try {
        const url = response.url();
        if (url.includes("/graphql")) {
          const json = await response.json();
          if (json?.data?.product?.reviews?.edges) {
            console.log(
              `📦 Found ${json.data.product.reviews.edges.length} reviews in GraphQL payload.`
            );
            pageData = json.data.product.reviews.edges.map((edge) => ({
              name: edge.node.user?.displayName || "Anonymous",
              date: edge.node.createdAt,
              rating: edge.node.rating,
              reviewBody: edge.node.body,
            }));
            cursor = json.data.product.reviews.pageInfo?.endCursor || null;
            keepFetching =
              json.data.product.reviews.pageInfo?.hasNextPage || false;
            console.log(`➡ Next page cursor: ${cursor}`);
            console.log(`🔄 More pages to fetch? ${keepFetching}`);
          }
        }
      } catch (err) {
        console.error(" Error processing GraphQL response:", err.message);
      }
    };

    page.on("response", graphqlListener);

    // Append cursor for pagination
    const targetUrl = cursor ? `${productUrl}?page=${cursor}` : productUrl;

    console.log(` Navigating to: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 60000 });
    await wait(4000); // give GraphQL time to load

    // Store reviews from this batch
    console.log(
      ` Storing ${pageData.length} reviews from page ${pageCount}...`
    );
    for (const review of pageData) {
      allReviews.set(review.name + review.date, review);
    }
    console.log(` Total unique reviews so far: ${allReviews.size}`);

    // Remove listener before next loop
    if (typeof page.off === "function") {
      page.off("response", graphqlListener);
    }

    if (!keepFetching) {
      console.log(" No more pages to fetch.");
      break;
    }
  }

  await browser.close();
  console.log(" Browser closed.");

  // Format & filter
  console.log(" Filtering reviews by date range...");
  const filteredReviews = Array.from(allReviews.values())
    .map((r) => ({
      ...r,
      date: format(new Date(r.date), "yyyy-MM-dd"),
    }))
    .filter((r) => {
      const d = new Date(r.date);
      return d >= new Date(startDate) && d <= new Date(endDate);
    });

  console.log(
    ` Found ${filteredReviews.length} reviews in the given date range.`
  );
  return filteredReviews;
}

app.get("/g2-reviews", async (req, res) => {
  try {
    const { url, start, end } = req.query;
    if (!url || !start || !end) {
      console.log("⚠ Missing required query params.");
      return res
        .status(400)
        .json({ error: "Missing required query params: url, start, end" });
    }

    console.log(" Incoming request to /g2-reviews");
    const data = await scrapeAllG2Reviews(url, start, end);
    res.json({ count: data.length, reviews: data });
  } catch (err) {
    console.error(" Scraping failed:", err.message);
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
});

app.listen(PORT, () =>
  console.log(` Server running on http://localhost:${PORT}`)
);
