import { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Cloud, Droplets, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [weather, setWeather] = useState(null);
  const [soilHealth, setSoilHealth] = useState(null);
  const [profitData, setProfitData] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('Hybrid Tomato');
  const [pestAlerts, setPestAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchProfitData(selectedCrop);
  }, [selectedCrop]);

  const fetchDashboardData = async () => {
    try {
      const [weatherRes, soilRes, pestRes] = await Promise.all([
        axios.get(`${API}/weather`),
        axios.get(`${API}/soil-health`),
        axios.get(`${API}/pest-alerts`),
      ]);

      setWeather(weatherRes.data);
      setSoilHealth(soilRes.data);
      setPestAlerts(pestRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const fetchProfitData = async (crop) => {
    try {
      const response = await axios.get(`${API}/profit-predictions`, {
        params: { crop },
      });
      setProfitData(response.data.data);
    } catch (error) {
      console.error('Error fetching profit data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Climate & Soil Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Climate Widget */}
        <div className="bg-white rounded-xl border border-slate-200 p-6" data-testid="climate-widget">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-medium text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Climate Data
            </h3>
            <Cloud className="text-slate-400" size={24} />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Location</span>
              <span className="font-semibold text-slate-900">Moranapalli, Tamil Nadu</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Temperature</span>
              <span className="font-semibold text-slate-900" data-testid="temperature">{weather?.temperature}°C</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Humidity</span>
              <span className="font-semibold text-slate-900" data-testid="humidity">{weather?.humidity}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Condition</span>
              <span className="font-semibold text-slate-900 capitalize">{weather?.description}</span>
            </div>
          </div>

          {weather?.alert && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <Droplets className="text-blue-600" size={20} />
              <span className="text-blue-800 text-sm font-medium" data-testid="weather-alert">{weather.alert}</span>
            </div>
          )}
        </div>

        {/* Soil Health Widget */}
        <div className="bg-white rounded-xl border border-slate-200 p-6" data-testid="soil-health-widget">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-medium text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Soil Health
            </h3>
            <TrendingUp className="text-slate-400" size={24} />
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">Nitrogen (N)</span>
                <span className="text-sm font-semibold text-slate-900" data-testid="nitrogen">{soilHealth?.nitrogen} kg/ha</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">Phosphorus (P)</span>
                <span className="text-sm font-semibold text-slate-900" data-testid="phosphorus">{soilHealth?.phosphorus} kg/ha</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '64%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">Potassium (K)</span>
                <span className="text-sm font-semibold text-slate-900" data-testid="potassium">{soilHealth?.potassium} kg/ha</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '57%' }}></div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">pH Balance</span>
                <span className="font-semibold text-green-600" data-testid="ph">{soilHealth?.ph}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profit Predictor Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6" data-tour="profit-graph" data-testid="profit-predictor">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Profit Predictor
          </h3>
          <div className="flex gap-2">
            <Button
              variant={selectedCrop === 'Hybrid Tomato' ? 'default' : 'outline'}
              onClick={() => setSelectedCrop('Hybrid Tomato')}
              className={selectedCrop === 'Hybrid Tomato' ? 'bg-[#064E3B] hover:bg-[#065F46]' : ''}
              data-testid="crop-toggle-tomato"
            >
              Hybrid Tomato
            </Button>
            <Button
              variant={selectedCrop === 'Rice' ? 'default' : 'outline'}
              onClick={() => setSelectedCrop('Rice')}
              className={selectedCrop === 'Rice' ? 'bg-[#064E3B] hover:bg-[#065F46]' : ''}
              data-testid="crop-toggle-rice"
            >
              Rice
            </Button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={profitData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" stroke="#64748B" />
            <YAxis stroke="#64748B" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: '#10B981', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 text-center text-sm text-slate-600">
          Projected monthly profit for {selectedCrop} (INR)
        </div>
      </div>

      {/* Pest Monitoring */}
      <div className="bg-white rounded-xl border border-slate-200 p-6" data-testid="pest-alerts">
        <h3 className="text-xl font-medium text-slate-800 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Local Pest Monitoring
        </h3>

        {pestAlerts.map((alert, index) => (
          <div
            key={index}
            className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
            data-testid={`pest-alert-${index}`}
          >
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-red-900">{alert.pest_name}</span>
                <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full uppercase">
                  {alert.risk_level} Risk
                </span>
              </div>
              <p className="text-sm text-red-700">
                {alert.description} - Detected in a {alert.radius_km}km radius
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;