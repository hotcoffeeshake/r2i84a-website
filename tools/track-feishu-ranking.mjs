import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const DEFAULT_SPREADSHEET_TOKEN = "Ianjs0OBlhi5UktruLGcmPIunmh";
const DEFAULT_SHEET_TITLE = "AI产品数据";
const DEFAULT_OUT = path.join(ROOT, "assets", "data", "feishu-ranking.json");
const DEFAULT_SNAPSHOT_DIR = path.join(
  ROOT,
  "materials",
  "feishu-ranking-source",
  "snapshots",
);

const SOURCE_EVIDENCE = [
  {
    label: "AIwatch 飞书入口",
    url: "https://my.feishu.cn/wiki/UH5QwtUWtis1gTk4R6rcnWK2nZc",
  },
  {
    label: "当前榜单飞书表格",
    url: "https://my.feishu.cn/wiki/Va2dw7HHsipBdtkCa6SchyE3nAg",
  },
  {
    label: "AIwatch 移动端报告公开转载",
    url: "https://www.fxbaogao.com/detail/5210957",
  },
  {
    label: "Sensor Tower",
    url: "https://sensortower.com/",
  },
];

const args = parseArgs(process.argv.slice(2));

main().catch((error) => {
  console.error(`[track-feishu-ranking] ${error.message}`);
  if (args.debug) console.error(error.stack);
  process.exit(1);
});

async function main() {
  if (args.help) {
    printHelp();
    return;
  }

  if (args.watch) {
    const intervalMs = Number(args.interval || process.env.TRACK_INTERVAL_MS || 30 * 60 * 1000);
    if (!Number.isFinite(intervalMs) || intervalMs < 60_000) {
      throw new Error("--interval must be at least 60000 ms");
    }
    await runOnce();
    setInterval(() => {
      runOnce().catch((error) => {
        console.error(`[track-feishu-ranking] ${new Date().toISOString()} ${error.stack || error}`);
      });
    }, intervalMs);
  } else {
    await runOnce();
  }
}

async function runOnce() {
  const startedAt = new Date();
  const spreadsheetToken =
    args.spreadsheetToken ||
    process.env.FEISHU_SPREADSHEET_TOKEN ||
    DEFAULT_SPREADSHEET_TOKEN;
  const sheetTitle = args.sheetTitle || process.env.FEISHU_SHEET_TITLE || DEFAULT_SHEET_TITLE;
  const sheetIdFromEnv = args.sheetId || process.env.FEISHU_SHEET_ID || "";
  const outputPath = path.resolve(args.out || process.env.FEISHU_RANKING_OUT || DEFAULT_OUT);
  const snapshotDir = path.resolve(
    args.snapshotDir || process.env.FEISHU_RANKING_SNAPSHOT_DIR || DEFAULT_SNAPSHOT_DIR,
  );

  const token = await getAccessToken();
  const meta = await requestFeishu(
    `sheets/v2/spreadsheets/${encodeURIComponent(spreadsheetToken)}/metainfo`,
    { token },
  );
  const sheets = extractSheets(meta);
  const sheet = chooseSheet(sheets, { sheetId: sheetIdFromEnv, sheetTitle });
  const range = args.range || process.env.FEISHU_RANGE || `${sheet.sheetId}!A1:Z200`;
  const valuesPayload = await requestFeishu(
    `sheets/v2/spreadsheets/${encodeURIComponent(spreadsheetToken)}/values/${encodeURIComponent(range)}?valueRenderOption=ToString&dateTimeRenderOption=FormattedString`,
    { token },
  );

  const rawRows = extractValues(valuesPayload);
  const normalized = normalizeRanking(rawRows, {
    spreadsheetToken,
    sheet,
    range,
    fetchedAt: startedAt.toISOString(),
  });

  const payload = {
    generatedAt: startedAt.toISOString(),
    source: {
      kind: "feishu_sheet",
      spreadsheetToken,
      sheetId: sheet.sheetId,
      sheetTitle: sheet.title || sheet.name || sheet.sheetId,
      range,
      upstream: "AIwatch.ai",
      originalMetricSource: "Sensor Tower / ST",
      evidence: SOURCE_EVIDENCE,
      note:
        "This tracks AIwatch's Feishu sheet. Direct source-level tracking requires Sensor Tower API or data feed access.",
    },
    stats: buildStats(normalized.items),
    header: normalized.header,
    fieldMap: normalized.fieldMap,
    items: normalized.items,
    rawRows,
    hash: hashJson({ rawRows, items: normalized.items }),
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.mkdirSync(snapshotDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);

  const snapshotPath = path.join(snapshotDir, `${startedAt.toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(snapshotPath, `${JSON.stringify(payload, null, 2)}\n`);

  console.log(
    [
      `[track-feishu-ranking] fetched ${payload.items.length} items`,
      `sheet=${payload.source.sheetTitle}`,
      `range=${range}`,
      `out=${path.relative(ROOT, outputPath)}`,
      `snapshot=${path.relative(ROOT, snapshotPath)}`,
    ].join(" "),
  );
}

async function getAccessToken() {
  const direct = process.env.FEISHU_TENANT_ACCESS_TOKEN || process.env.FEISHU_ACCESS_TOKEN;
  if (direct) return direct;

  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error(
      [
        "Missing Feishu credentials.",
        "Set FEISHU_TENANT_ACCESS_TOKEN, or set FEISHU_APP_ID and FEISHU_APP_SECRET.",
        "The app must have spreadsheet read permission and access to the target sheet.",
      ].join(" "),
    );
  }

  const response = await fetch(
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    },
  );
  const data = await response.json();
  if (!response.ok || data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`Failed to get Feishu tenant_access_token: ${JSON.stringify(data)}`);
  }
  return data.tenant_access_token;
}

async function requestFeishu(apiPath, { token }) {
  const url = `https://open.feishu.cn/open-apis/${apiPath}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json; charset=utf-8",
    },
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Feishu API returned non-JSON ${response.status}: ${text.slice(0, 500)}`);
  }
  if (!response.ok || data.code !== 0) {
    throw new Error(`Feishu API error ${response.status} for ${apiPath}: ${JSON.stringify(data)}`);
  }
  return data;
}

function extractSheets(meta) {
  const data = meta.data || {};
  const candidates =
    data.sheets ||
    data.sheet ||
    data.spreadsheet?.sheets ||
    data.properties?.sheets ||
    data.spreadsheet?.properties?.sheets ||
    [];
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error(`No sheets found in metainfo response: ${JSON.stringify(meta).slice(0, 1000)}`);
  }
  return candidates.map((sheet) => ({
    ...sheet,
    sheetId: sheet.sheetId || sheet.sheet_id || sheet.id,
    title: sheet.title || sheet.name || sheet.sheetName || sheet.sheet_name,
  }));
}

function chooseSheet(sheets, { sheetId, sheetTitle }) {
  if (sheetId) {
    const match = sheets.find((sheet) => sheet.sheetId === sheetId);
    if (!match) throw new Error(`Sheet id ${sheetId} not found. Available: ${listSheets(sheets)}`);
    return match;
  }

  const exact = sheets.find((sheet) => sheet.title === sheetTitle);
  if (exact) return exact;

  const partial = sheets.find((sheet) => normalizeText(sheet.title).includes(normalizeText(sheetTitle)));
  if (partial) return partial;

  if (sheets.length === 1) return sheets[0];
  throw new Error(`Sheet title ${sheetTitle} not found. Available: ${listSheets(sheets)}`);
}

function listSheets(sheets) {
  return sheets.map((sheet) => `${sheet.title || "(untitled)"}:${sheet.sheetId}`).join(", ");
}

function extractValues(payload) {
  const values =
    payload.data?.valueRange?.values ||
    payload.data?.value_range?.values ||
    payload.data?.values ||
    [];
  if (!Array.isArray(values)) {
    throw new Error(`No values found in range response: ${JSON.stringify(payload).slice(0, 1000)}`);
  }
  return values.map((row) => (Array.isArray(row) ? row.map(cleanCell) : []));
}

function normalizeRanking(rawRows, context) {
  const headerIndex = findHeaderRow(rawRows);
  if (headerIndex === -1) {
    return {
      header: [],
      fieldMap: {},
      items: [],
      warning: "No ranking header row found",
      context,
    };
  }

  const header = rawRows[headerIndex].map((cell) => normalizeHeader(cell));
  const fieldMap = buildFieldMap(header);
  const periodColumns = findPeriodColumns(header);
  const items = [];

  for (let i = headerIndex + 1; i < rawRows.length; i += 1) {
    const row = rawRows[i];
    if (!row || row.every((cell) => cleanCell(cell) === "")) continue;

    const name = valueAt(row, fieldMap.name);
    const rank = parseNumber(valueAt(row, fieldMap.rank));
    if (!name && !Number.isFinite(rank)) continue;

    const activeValue = valueAt(row, fieldMap.activeUsers);
    const activeUsers = parseNumber(activeValue);
    const sourcePeriod = header[fieldMap.activeUsers] || "";
    const monthly = {};
    for (const column of periodColumns) {
      const value = valueAt(row, column.index);
      monthly[column.label] = parseNumber(value);
    }

    items.push({
      id: slugify(`${rank || i}-${name}`),
      rank: Number.isFinite(rank) ? rank : null,
      name,
      category: valueAt(row, fieldMap.category) || "未分类",
      activeUsers: Number.isFinite(activeUsers) ? activeUsers * 10000 : null,
      activeUsersDisplay: formatWan(activeValue),
      activeUsersUnit: "万",
      activeUsersMetric: "MAU",
      activeUsersPeriod: extractPeriod(sourcePeriod, context.range),
      activeUsersRegion: "全球",
      monthOverMonth: valueAt(row, fieldMap.change),
      monthlyActiveUsersWan: monthly,
      sourceName: "AIwatch.ai / Sensor Tower(ST)",
      sourceType: "third_party_aggregated",
      confidence: "B",
      lastVerifiedAt: context.fetchedAt.slice(0, 10),
      sourceUrl: "https://my.feishu.cn/wiki/Va2dw7HHsipBdtkCa6SchyE3nAg",
      sourceNote:
        "飞书表格为 AIwatch.ai 二次整理；公开移动端报告说明上游数据来源为 ST，单位为万月活跃用户。",
      rawRow: row,
    });
  }

  items.sort((a, b) => (a.rank ?? 999999) - (b.rank ?? 999999));
  return { header, fieldMap, items, context };
}

function findHeaderRow(rows) {
  return rows.findIndex((row) => {
    const line = row.map(normalizeText).join(" ");
    return /(排行|排名)/.test(line) && /(产品|名称)/.test(line) && /(活跃|用户)/.test(line);
  });
}

function normalizeHeader(cell) {
  return cleanCell(cell).replace(/\s+/g, " ").trim();
}

function buildFieldMap(header) {
  const map = {};
  header.forEach((label, index) => {
    const compact = normalizeText(label);
    if (map.rank == null && /^(排行|排名)$/.test(compact)) map.rank = index;
    if (map.name == null && /(产品名|产品名称|产品|名称)/.test(compact)) map.name = index;
    if (map.category == null && /分类/.test(compact)) map.category = index;
    if (map.activeUsers == null && /活跃用户/.test(compact)) map.activeUsers = index;
    if (map.change == null && /(相对上月|上月变化|变化|环比)/.test(compact)) map.change = index;
  });
  return map;
}

function findPeriodColumns(header) {
  return header
    .map((label, index) => ({ label, index }))
    .filter(({ label }) => /(20)?\d{2}年\d{1,2}月|^\d{1,2}月$/.test(normalizeText(label)));
}

function valueAt(row, index) {
  if (index == null || index < 0) return "";
  return cleanCell(row[index]);
}

function cleanCell(value) {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).replace(/\u200b/g, "").trim();
}

function normalizeText(value) {
  return cleanCell(value).replace(/\s+/g, "");
}

function parseNumber(value) {
  const text = cleanCell(value).replace(/,/g, "");
  if (!text || text === "--" || text === "待确认" || text === "未披露") return null;
  const match = text.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function formatWan(value) {
  const text = cleanCell(value);
  if (!text || text === "--") return "--";
  if (/待确认|未披露/.test(text)) return text;
  const number = parseNumber(text);
  return Number.isFinite(number) ? `${number} 万` : text;
}

function extractPeriod(headerLabel) {
  const text = normalizeText(headerLabel);
  const month = text.match(/(\d{1,2})月/);
  if (!month) return "";
  return `2026-${String(Number(month[1])).padStart(2, "0")}`;
}

function buildStats(items) {
  const total = items.length;
  const confirmed = items.filter((item) => item.activeUsers != null).length;
  return {
    total,
    confirmed,
    pending: total - confirmed,
    unknownSource: 0,
    confidence: items.reduce((acc, item) => {
      acc[item.confidence] = (acc[item.confidence] || 0) + 1;
      return acc;
    }, {}),
  };
}

function hashJson(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function slugify(value) {
  return cleanCell(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--watch") parsed.watch = true;
    else if (arg.startsWith("--")) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) parsed[key] = true;
      else {
        parsed[key] = next;
        i += 1;
      }
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`Usage:
  node --env-file=.env.local tools/track-feishu-ranking.mjs
  node --env-file=.env.local tools/track-feishu-ranking.mjs --watch --interval 1800000
  FEISHU_APP_ID=... FEISHU_APP_SECRET=... node tools/track-feishu-ranking.mjs
  FEISHU_TENANT_ACCESS_TOKEN=... node tools/track-feishu-ranking.mjs --watch --interval 1800000

Options:
  --spreadsheet-token <token>  Defaults to the AIwatch sheet token found in the Wiki.
  --sheet-title <title>        Defaults to "${DEFAULT_SHEET_TITLE}".
  --sheet-id <id>              Use a specific sheet id instead of title matching.
  --range <range>              Defaults to <sheetId>!A1:Z200.
  --out <path>                 Defaults to assets/data/feishu-ranking.json.
  --snapshot-dir <path>        Defaults to materials/feishu-ranking-source/snapshots.
  --watch                      Keep polling.
  --interval <ms>              Poll interval for --watch. Minimum 60000.
  --debug                      Print stack traces for errors.
`);
}
