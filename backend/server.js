const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

/* ---------------- HELPERS ---------------- */

const toNumber = v => {
  const n = Number(String(v ?? '').replace(/,/g, ''));
  return Number.isNaN(n) ? 0 : n;
};

const parseDate = v => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'number') {
    const epoch = new Date(1899, 11, 30);
    return new Date(epoch.getTime() + v * 86400000);
  }
  const d = new Date(v);
  return isNaN(d) ? null : d;
};

const readSheet = (wb, name) =>
  XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null });

/* ---------------- API ---------------- */

app.get('/api/data', (req, res) => {
  const { startDate, endDate } = req.query;

  const filePath = path.join(
    __dirname,
    'data',
    'FullStack_Summary_Dashboard_Data.xlsx'
  );

  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ error: 'Excel file not found' });
  }

  const wb = XLSX.readFile(filePath, { cellDates: true });

  const bookings = readSheet(wb, 'Bookings').map(r => ({
    customer: r.Customer,
    region: r.Region,
    product: r.Product,
    amount: toNumber(r.Booking_Amount),
    date: parseDate(r.Booking_Date)
  }));

  const billings = readSheet(wb, 'Billings').map(r => ({
    customer: r.Customer,
    region: r.Region,
    product: r.Product,
    amount: toNumber(r.Billed_Amount),
    date: parseDate(r.Billing_Date)
  }));

  const backlogs = readSheet(wb, 'Backlogs').map(r => ({
    customer: r.Customer,
    region: r.Region,
    product: r.Product,
    amount: toNumber(r.Backlog_Amount)
  }));

  /* -------- DATE FILTER -------- */

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  const inRange = d =>
    !d || ((!start || d >= start) && (!end || d <= end));

  const bookingsF = bookings.filter(b => inRange(b.date));
  const billingsF = billings.filter(b => inRange(b.date));

  /* -------- TABLE -------- */

  const tableMap = {};

  const ensure = (customer, region, product) => {
    const k = `${customer}|${region}|${product}`;
    if (!tableMap[k]) {
      tableMap[k] = {
        customer,
        region,
        product,
        totalBookings: 0,
        totalBillings: 0,
        backlog: 0
      };
    }
    return tableMap[k];
  };

  // bookings (date filtered)
  bookingsF.forEach(b => {
    ensure(b.customer, b.region, b.product).totalBookings += b.amount;
  });

  // billings (date filtered)
  billingsF.forEach(b => {
    ensure(b.customer, b.region, b.product).totalBillings += b.amount;
  });

  // allow backlog ONLY if booking/billing exists in date range
  const validKeys = new Set(
    [...bookingsF, ...billingsF].map(
      b => `${b.customer}|${b.region}|${b.product}`
    )
  );

  backlogs.forEach(b => {
    const k = `${b.customer}|${b.region}|${b.product}`;
    if (validKeys.has(k)) {
      ensure(b.customer, b.region, b.product).backlog += b.amount;
    }
  });

  const tableRows = Object.values(tableMap).map(r => ({
    ...r,
    bookToBillRatio: r.totalBillings
      ? r.totalBookings / r.totalBillings
      : null
  }));

  /* -------- CHART AGGREGATIONS -------- */

  const monthlyAgg = rows => {
    const m = {};
    rows.forEach(r => {
      if (!r.date) return;
      const key = `${r.date.getFullYear()}-${String(
        r.date.getMonth() + 1
      ).padStart(2, '0')}`;
      m[key] = (m[key] || 0) + r.amount;
    });
    return Object.entries(m)
      .sort()
      .map(([month, value]) => ({ month, value }));
  };

  const aggregate = (rows, key) =>
    rows.reduce((acc, r) => {
      const k = r[key] || 'Unknown';
      acc[k] = (acc[k] || 0) + r.amount;
      return acc;
    }, {});

  /* -------- RESPONSE -------- */

  res.json({
    bookingsMonthly: monthlyAgg(bookingsF),
    billingsMonthly: monthlyAgg(billingsF),
    backlogByRegion: aggregate(
      backlogs.filter(b =>
        validKeys.has(`${b.customer}|${b.region}|${b.product}`)
      ),
      'region'
    ),
    bookingsByProduct: aggregate(bookingsF, 'product'),
    tableRows
  });
});

/* -------- HEALTH -------- */

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
