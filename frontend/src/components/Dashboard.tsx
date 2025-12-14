import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Box,
  CircularProgress,
  Divider,
  Stack
} from '@mui/material';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

/* ---------------- CONSTANTS ---------------- */

const COLORS = ['#1976d2', '#9c27b0', '#2e7d32', '#ed6c02', '#d32f2f'];
const safeNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/* ---------------- COMPONENT ---------------- */

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filter, setFilter] = useState({
    region: 'All',
    product: 'All',
    customer: 'All'
  });

  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  /* ---------------- FETCH ---------------- */

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:4000/api/data', {
        params: {
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined
        }
      });
      setData(res.data);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------------- TABLE DATA ---------------- */

  const tableRows = useMemo(() => {
    if (!Array.isArray(data?.tableRows)) return [];
    return data.tableRows.map((r: any, i: number) => ({
      id: i,
      customer: r.customer ?? 'Unknown',
      region: r.region ?? 'Unknown',
      product: r.product ?? 'Unknown',
      totalBookings: safeNum(r.totalBookings),
      totalBillings: safeNum(r.totalBillings),
      backlog: safeNum(r.backlog),
      bookToBillRatio: r.bookToBillRatio
    }));
  }, [data]);

  const filteredRows = useMemo(() => {
    return tableRows.filter((r: { region: string; product: string; customer: string; }) =>
      (filter.region === 'All' || r.region === filter.region) &&
      (filter.product === 'All' || r.product === filter.product) &&
      (filter.customer === 'All' || r.customer === filter.customer)
    );
  }, [tableRows, filter]);

  /* ---------------- FILTER OPTIONS ---------------- */

  const regions = ['All', ...new Set(tableRows.map((r: { region: any; }) => r.region))];
  const products = ['All', ...new Set(tableRows.map((r: { product: any; }) => r.product))];
  const customers = ['All', ...new Set(tableRows.map((r: { customer: any; }) => r.customer))];

  /* ---------------- SUMMARY (FILTER AWARE) ---------------- */

  const summary = useMemo(() => {
    let bookings = 0;
    let billings = 0;
    let backlog = 0;

    filteredRows.forEach((r: { totalBookings: number; totalBillings: number; backlog: number; }) => {
      bookings += r.totalBookings;
      billings += r.totalBillings;
      backlog += r.backlog;
    });

    return {
      totalBookingsMTD: bookings,
      totalBillingsMTD: billings,
      totalBacklog: backlog,
      bookToBillRatio: billings ? bookings / billings : null
    };
  }, [filteredRows]);

  /* ---------------- CHART DATA ---------------- */

  const monthlySeries = useMemo(() => {
    if (!data) return [];
    const map: any = {};

    data.bookingsMonthly?.forEach((b: any) => {
      map[b.month] = { month: b.month, bookings: b.value, billings: 0 };
    });

    data.billingsMonthly?.forEach((b: any) => {
      map[b.month] ||= { month: b.month, bookings: 0, billings: 0 };
      map[b.month].billings = b.value;
    });

    return Object.values(map).sort((a: any, b: any) =>
      a.month.localeCompare(b.month)
    );
  }, [data]);

  const backlogByRegion = useMemo(() => {
    return filteredRows.reduce((acc: any[], r: { region: any; backlog: any; }) => {
      const found = acc.find(a => a.region === r.region);
      if (found) found.backlog += r.backlog;
      else acc.push({ region: r.region, backlog: r.backlog });
      return acc;
    }, []);
  }, [filteredRows]);

  const bookingsByProduct = useMemo(() => {
    return filteredRows.reduce((acc: any[], r: { product: any; totalBookings: any; }) => {
      const found = acc.find(a => a.name === r.product);
      if (found) found.value += r.totalBookings;
      else acc.push({ name: r.product, value: r.totalBookings });
      return acc;
    }, []);
  }, [filteredRows]);

  /* ---------------- EXPORT ---------------- */

  const exportCSV = () => {
    if (!filteredRows.length) return;
    const header = Object.keys(filteredRows[0]).join(',');
    const body = filteredRows
      .map((r: { [s: string]: unknown; } | ArrayLike<unknown>) => Object.values(r).map(v => `"${v ?? ''}"`).join(','))
      .join('\n');

    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'dashboard.csv';
    link.click();
  };

  /* ---------------- UI STATES ---------------- */

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  /* ---------------- TABLE COLUMNS ---------------- */

  const columns: GridColDef[] = [
    { field: 'customer', headerName: 'Customer', flex: 1 },
    { field: 'region', headerName: 'Region', flex: 1 },
    { field: 'product', headerName: 'Product', flex: 1 },
    { field: 'totalBookings', headerName: 'Bookings', flex: 1 },
    { field: 'totalBillings', headerName: 'Billings', flex: 1 },
    { field: 'backlog', headerName: 'Backlog', flex: 1 },
    {
      field: 'bookToBillRatio',
      headerName: 'Book/Bill',
      flex: 1,
      renderCell: p =>
        p.value ? (
          <span style={{ color: p.value < 0.9 ? 'red' : 'inherit' }}>
            {p.value.toFixed(2)}
          </span>
        ) : 'N/A'
    }
  ];

  /* ---------------- RENDER ---------------- */

  return (
    <Box p={2}>
      <Typography variant="h4" mb={2}>Summary Dashboard</Typography>

      {/* FILTERS */}
      <Stack direction="row" spacing={2} flexWrap="wrap" mb={3}>
        <TextField
          type="date"
          label="Start Date"
          InputLabelProps={{ shrink: true }}
          value={dateRange.start}
          onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
        />
        <TextField
          type="date"
          label="End Date"
          InputLabelProps={{ shrink: true }}
          value={dateRange.end}
          onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
        />

        {[['Region', regions, 'region'], ['Product', products, 'product'], ['Customer', customers, 'customer']]
          .map(([label, items, key]: any) => (
            <TextField key={key} select label={label}
              value={(filter as any)[key]}
              onChange={e => setFilter({ ...filter, [key]: e.target.value })}
            >
              {items.map((v: string) => (
                <MenuItem key={v} value={v}>{v}</MenuItem>
              ))}
            </TextField>
          ))}

        <Button variant="contained" onClick={fetchData}>Apply</Button>
        <Button startIcon={<SaveAltIcon />} onClick={exportCSV}>Export CSV</Button>
      </Stack>

      {/* SUMMARY CARDS */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
        {[
          { label: 'Total Bookings (MTD)', value: summary.totalBookingsMTD },
          { label: 'Total Billings (MTD)', value: summary.totalBillingsMTD },
          { label: 'Total Backlog', value: summary.totalBacklog },
          {
            label: 'Book-to-Bill Ratio',
            value: summary.bookToBillRatio?.toFixed(2) ?? 'N/A'
          }
        ].map((c, i) => (
          <Card key={i} sx={{ minWidth: 220 }}>
            <CardContent>
              <Typography variant="caption">{c.label}</Typography>
              <Typography variant="h6">{c.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* CHARTS */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
        <Card sx={{ flex: 2, minWidth: 300 }}>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlySeries}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line dataKey="bookings" stroke={COLORS[0]} />
                <Line dataKey="billings" stroke={COLORS[2]} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 250 }}>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={backlogByRegion}>
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="backlog" fill={COLORS[3]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 250 }}>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={bookingsByProduct} dataKey="value" nameKey="name" label>
                  {bookingsByProduct.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Stack>

      {/* TABLE */}
      <Card>
        <CardContent>
          <Typography variant="h6">Drill-Down Summary</Typography>
          <Divider sx={{ my: 2 }} />
          <Box height={420}>
            <DataGrid rows={filteredRows} columns={columns} />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
