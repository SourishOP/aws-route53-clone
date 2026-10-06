import { chromium } from "playwright";
import fs from "fs";

const OUT = "c:/Users/dasso/OneDrive/Desktop/Scalar/.agents/tasks/route53-console-overhaul/shots";
const BASE = "http://localhost:3000";

const log = (...a) => console.log(...a);

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  log("shot:", name);
}

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  // --- login page (unauth) ---
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await shot(page, "01-login");

  // fill login
  await page.fill('input[name="username"], input#username, input[type="text"]', "admin").catch(()=>{});
  // fallback: first text input
  const uname = await page.$('input');
  await page.locator('input').first().fill("admin");
  await page.locator('input[type="password"]').fill("admin");
  await page.locator('button[type="submit"], button:has-text("Sign in")').first().click();
  await page.waitForURL(/hosted-zones|dashboard/, { timeout: 15000 }).catch(()=>{});
  await page.waitForLoadState("networkidle");
  await shot(page, "02-after-login");

  const routes = [
    ["dashboard", "/dashboard"],
    ["hosted-zones", "/hosted-zones"],
    ["hosted-zones-create", "/hosted-zones/create"],
    ["health-checks", "/health-checks"],
    ["profiles", "/profiles"],
    ["global-resolvers", "/global-resolvers"],
    ["shared-dns-views", "/shared-dns-views"],
    ["vpcs", "/vpcs"],
    ["inbound-endpoints", "/inbound-endpoints"],
    ["outbound-endpoints", "/outbound-endpoints"],
    ["rules", "/rules"],
    ["query-logging", "/query-logging"],
    ["outposts", "/outposts"],
    ["registered-domains", "/registered-domains"],
    ["requests", "/requests"],
    ["cidr-collections", "/cidr-collections"],
    ["traffic-policies", "/traffic-policies"],
    ["policy-records", "/policy-records"],
  ];

  let i = 10;
  for (const [name, path] of routes) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await shot(page, `${i}-${name}`);
    i++;
  }

  // --- open account menu on hosted-zones ---
  await page.goto(`${BASE}/hosted-zones`, { waitUntil: "networkidle" });
  await page.locator('.topnav__item').click().catch(()=>{});
  await page.waitForTimeout(300);
  await shot(page, "90-account-menu");

  // dump the account label text + sidebar text
  const topText = await page.locator('.topnav__item').first().innerText().catch(()=>"(none)");
  const sidebarText = await page.locator('.sidebar').first().innerText().catch(()=>"(none)");
  fs.writeFileSync(`${OUT}/_text.txt`, "TOPNAV ITEM:\n" + topText + "\n\nSIDEBAR:\n" + sidebarText + "\n\nCONSOLE ERRORS:\n" + errors.join("\n"));

  await browser.close();
  log("DONE. errors:", errors.length);
};

run().catch((e) => { console.error("FATAL", e); process.exit(1); });
