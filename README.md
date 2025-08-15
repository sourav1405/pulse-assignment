# pulse-assignment
# G2 & Capterra Review Scraper Attempt

## Overview
This project was an attempt to scrape product reviews from G2 & Capterra .  
I explored multiple approaches to achieve the goal within limited time.

## Approach & Challenges
1. **Puppeteer Scraping**
   - Initially, I tried scraping the G2 website using **Puppeteer**.
   - However, G2 has strong anti-scraping mechanisms that prevented direct extraction of reviews.
   - I have included the function in the codebase showing my Puppeteer approach for reference.

2. **API Possibility**
   - While reviewing the site’s network calls, I noticed that APIs were available.
   - These APIs could have been used to fetch the reviews directly if I had proper access or authorization.

3. **Mock Data Approach**
   - Due to time constraints and scraping restrictions, I decided to create a mock-reviews.json file containing sample review data.
   - The application fetches and displays data from this mock file to demonstrate the intended functionality.

## Notes
- The main focus was on demonstrating the workflow rather than obtaining live production data.
- Given more time, I would integrate the authorized API calls or a more sophisticated scraping solution.

---
**Status:** Prototype using mock data

## How to run
You have to do npm start and the it will start the server in local 
## Link:
http://localhost:3000/reviews?company=Zoom&start=2024-01-01&end=2024-07-31&source=all

