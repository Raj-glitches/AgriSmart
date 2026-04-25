import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

/**
 * AnalyticsCharts Component
 * Reusable charts for dashboard analytics using Recharts
 * 
 * Why Recharts?
 * - Declarative React charting library built on D3
 * - Easy to customize and responsive
 * - Supports Bar, Line, Pie, Area charts
 * 
 * Integration: Consumes API data and renders visualizations
 */

const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'];

const AnalyticsCharts = ({ data, type = 'revenue' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-earth-500">
        <p>No data available for analytics</p>
      </div>
    );
  }

  // Revenue chart (monthly)
  if (type === 'revenue') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis 
            dataKey="_id" 
            stroke="#78716c"
            fontSize={12}
            tickFormatter={(value) => {
              const [year, month] = value.split('-');
              return `${month}/${year}`;
            }}
          />
          <YAxis stroke="#78716c" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e7e5e4',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            formatter={(value) => [`₹${value}`, 'Revenue']}
          />
          <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Order trends (line chart)
  if (type === 'orders') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis dataKey="_id" stroke="#78716c" fontSize={12} />
          <YAxis stroke="#78716c" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e7e5e4',
              borderRadius: '8px'
            }}
          />
          <Line type="monotone" dataKey="orders" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a' }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Pie chart for distribution
  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
};

export default AnalyticsCharts;

