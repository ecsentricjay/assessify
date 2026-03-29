# Admin CBT Analytics Dashboard Implementation Guide

## Overview

You now have a **production-ready admin analytics dashboard** for your CBT (Computer-Based Testing) platform. This comprehensive system provides detailed insights into practice sessions, revenue, promo code performance, referrals, and student activity.

## File Locations

### Server Actions
**File**: `src/lib/actions/admin-cbt-analytics.actions.ts`

Contains all data fetching functions and type definitions:
- `getCBTAnalytics()` - Main function to fetch all analytics data
- `generateAnalyticsCSV()` - Export analytics to CSV format
- 12 helper functions for specific analytics queries
- Full TypeScript type definitions for all data structures

### Page Component
**File**: `src/app/admin/cbt/analytics/page.tsx`

Client component with full UI implementation:
- Date range filters
- Summary cards with key metrics
- Interactive charts using Recharts
- Promo code performance table with search
- Top performers sections
- Recent activity feed
- Export functionality
- Auto-refresh capability

## Dashboard Sections

### 1. Summary Cards (Top Row)
Six key metrics cards displaying:
- **Total Revenue** (from bundle sales)
- **Active Subscriptions** (with expiring count)
- **Practice Sessions** (with average score)
- **Promo Code Earnings** (with active code count)
- **Bundles Sold** (total count)
- **Avg Revenue Per User** (calculated metric)

Each card includes:
- Color-coded icons
- Current values
- Helpful context/subtitles
- Trend indicators (optional)

**Colors Used**:
- Green: Revenue/Money metrics
- Blue: User/Subscription metrics
- Purple: Session metrics
- Orange: Promo/Commission metrics
- Pink: Bundle metrics
- Indigo: Calculated metrics

### 2. Revenue Analytics

**Revenue Over Time Chart**
- Line chart showing daily revenue
- Useful for identifying revenue trends
- Interactive tooltips with formatted currency

**Revenue by Bundle**
- Grouped bar chart showing both revenue and units sold
- Sortable comparison of bundle performance
- Shows net revenue and sales volume

**Promo Code Impact**
- Pie chart comparing revenue from promo vs non-promo sales
- Displays total discount given to customers
- Shows commission paid to referrers
- Quick stats in grid below chart

### 3. Practice Activity Metrics

**Sessions Over Time**
- Line chart showing daily completed sessions
- Useful for identifying peak practice periods
- Shows student engagement trends

**Score Distribution**
- Bar chart showing students grouped by score ranges:
  - 0-40% (Needs improvement)
  - 40-60% (Below average)
  - 60-80% (Average)
  - 80-100% (Excellent)
- Identifies performance patterns across user base

**Course Popularity**
- Horizontal bar chart showing sessions per course
- Ordered by popularity
- Shows which courses get the most practice

### 4. Promo Code Performance Table

**Features**:
- Searchable by promo code or owner name
- Columns: Code, Owner, Uses, Commission, Conversion Rate, Status
- Shows all active and inactive promo codes
- Detailed owner information (name and role)
- Real-time data

**Search**:
- Type promo code or owner name to filter
- Real-time filtering as you type

### 5. Top Performers (Three Cards)

**Top Referrers**
- Top 10 users by promo code earnings
- Shows: Name, Code, Uses, Total Commission
- Ranked with numbered badges
- Green highlight on earnings amount

**Top Bundles**
- Top 5 bundles by sales count
- Shows: Bundle Name, Sales Count, Total Revenue
- Ranked with numbered badges
- Orange highlight on ranking

**Top Students**
- Top 10 students by practice sessions
- Shows: Name, Sessions Count, Average Score
- Active learners and high performers
- Green highlight on ranking

### 6. Recent Activity Feed

**Shows Latest Transactions**:
- Bundle purchases
- Promo commission credits
- Wallet funding/withdrawals
- Transaction status

**Details**:
- Timestamp (formatted)
- User name
- Action type
- Amount (formatted currency)
- Status badge

## Features

### Date Range Filtering
**Options**:
- Today
- Last 7 Days
- Last 30 Days
- Last 90 Days
- All Time
- Dropdown selector updates all metrics automatically

### Export Functionality
**CSV Export**:
- Exports all analytics data to CSV file
- Includes summary stats, bundle revenue, promo performance, top performers
- Filename: `cbt-analytics-[DATE].csv`
- Button: Blue outline style with download icon

### Auto-Refresh
**Toggle Button**:
- Automatically refreshes data every 30 seconds
- Shows "Auto-refresh ON/OFF" status
- Last updated timestamp shown
- Useful for real-time monitoring

### Search Functionality
**Promo Table Search**:
- Real-time filtering as you type
- Searches both promo code and owner name
- Shows message when no results match
- Case-insensitive search

### Loading States & Error Handling

**Loading Skeleton**:
- Shows animated placeholder while fetching data
- Prevents layout shift
- Better UX during slow connections

**Error Display**:
- Red alert card with error message
- Retry button for failed requests
- Clear error messaging
- Fallback empty states

## Data Structure

### SummaryStats
```typescript
{
  totalRevenue: number
  activeSubscriptions: number
  totalSessions: number
  avgSessionScore: number
  promoEarnings: number
  bundlesSold: number
  avgRevenuePerUser: number
  expiringSubscriptions: number
  activePromoCodes: number
}
```

### RevenueDataPoint
```typescript
{
  date: string (YYYY-MM-DD)
  revenue: number
}
```

### BundleRevenue
```typescript
{
  bundleId: string
  bundleName: string
  revenue: number
  sold: number
  avgPrice: number
}
```

### PromoCodePerformance
```typescript
{
  id: string
  promoCode: string
  ownerName: string
  ownerRole: string
  totalUses: number
  totalRevenue: number
  commissionEarned: number
  conversionRate: number
  status: string
  ownerId: string
}
```

## Database Tables Used

The analytics system queries the following Supabase tables:
- `cbt_student_subscriptions` - Bundle purchases and subscriptions
- `cbt_subscription_bundles` - Bundle details and pricing
- `cbt_practice_sessions` - Practice session data and scores  
- `bundle_promo_earnings` - Promo commission tracking
- `promo_codes` - Promo code configuration and stats
- `cbt_courses` - Course information
- `profiles` - User information (name, role)
- `transactions` - Financial transactions

## Access Control

⚠️ **Admin Only**: This page is restricted to users with `role === 'admin'`

Non-admin users are redirected with error message "Unauthorized. Admin access required."

## Query Performance

### Optimization Strategies Used:
1. **Parallel Queries**: All analytics data fetched simultaneously using `Promise.all()`
2. **Aggregation**: Data grouped and calculated server-side, not in browser
3. **Selective Joins**: Only joins necessary fields to reduce data transfer
4. **Filtering**: Date range filtering applied at database query level
5. **Limits**: Top performers limited to 5-10 items each

### Expected Load Times:
- Initial load: 2-5 seconds (all data)
- Refresh: 1-3 seconds (auto-refresh)
- Subsequent filter: 1-2 seconds

## CSV Export Format

The export includes:
1. **Summary Statistics** - All 9 summary metrics
2. **Revenue by Bundle** - Bundle name, revenue, units sold, avg price
3. **Promo Code Performance** - Code, owner, uses, commission, conversion rate
4. **Top Referrers** - Name, code, uses, earnings
5. **Top Students** - Name, sessions, average score

Perfect for:
- Executive reporting
- Historical analysis
- Data backup
- External sharing

## Customization Guide

### Change Date Filters
Edit `DATE_FILTERS` constant in page.tsx:
```typescript
const DATE_FILTERS: Record<string, DateFilter> = {
  customPeriod: {
    label: 'Custom Label',
    getValue: () => ({
      startDate: '2025-01-01',
      endDate: '2025-12-31'
    })
  }
}
```

### Adjust Color Scheme
Modify `COLORS` array for pie chart:
```typescript
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', ...]
```

### Change Auto-Refresh Interval
Edit interval in effect hook (currently 30000ms = 30 seconds):
```typescript
const interval = setInterval(() => {
  fetchAnalytics()
}, 30000) // Change this value
```

### Modify Table Display
Update `promoPerformance` filtering logic in search section:
```typescript
.filter(promo => {
  // Customize filter logic here
})
```

## Troubleshooting

### No Data Showing
1. Check if admin user is logged in
2. Verify date range covers dates with actual data
3. Check browser console for errors
4. Try "All Time" filter
5. Click Retry button to refetch

### Slow Loading
1. Reduce date range to smaller period
2. Check database connection
3. Try auto-refresh OFF
4. Clear browser cache

### Export Not Working
1. Check if data is loaded (not in loading state)
2. Verify browser allows downloads
3. Check file size (very large datasets may fail)
4. Try smaller date range

### Charts Not Displaying
1. Ensure data exists for selected period
2. Check browser console for recharts errors
3. Verify responsive container width
4. Try different date filter

## Security Considerations

✅ **Implemented Security**:
- Admin-only access check on server
- Server-side data aggregation (no sensitive data in client)
- Prepared statements via Supabase SDK
- No hard-coded credentials
- CSRF protection via Next.js

## Future Enhancement Ideas

### Additional Metrics
- Revenue per course
- Student retention rate
- Average session duration
- Skill improvement tracking
- Device/platform breakdown

### Enhanced Visualizations
- Heatmaps for peak times
- Geographic distribution maps
- Funnel charts for subscription flow
- Real-time metric updates

### Advanced Features
- Custom report builder
- Scheduled email reports
- Anomaly detection alerts
- Predictive revenue forecasting
- Budget vs actual tracking

### Export Options
- PDF reports with branding
- Excel with formatted sheets
- Email delivery
- Cloud storage integration

## Migration Notes

If migrating from another dashboard:
1. Ensure all database tables exist and have data
2. Update table names if different from convention
3. Adjust field mappings in helper functions
4. Test queries with existing data
5. Verify calculations match previous system

## Dependencies

### Required npm packages (already in your project):
- `recharts` - Charting library
- `sonner` - Toast notifications
- `shadcn/ui` - UI components
- `lucide-react` - Icons
- `@supabase/supabase-js` - Database

## Support & Monitoring

### Key Metrics to Watch
- Total Revenue trend (should be positive)
- Active Subscriptions growth
- Session completion rate
- Promo conversion rate
- Bundle performance (identify top/bottom)

### Regular Maintenance
- Review promo codes monthly (deactivate inactive ones)
- Archive old data for performance
- Update bundle pricing based on performance
- Check for abandoned subscriptions

---

**Dashboard Created**: March 21, 2026
**Status**: Production Ready ✅
**Last Updated**: March 21, 2026
