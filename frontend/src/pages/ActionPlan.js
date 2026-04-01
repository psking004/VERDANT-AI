import { useState } from 'react';
import axios from 'axios';
import { Sprout, DollarSign, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ActionPlan = () => {
  const [landSize, setLandSize] = useState('');
  const [budget, setBudget] = useState('');
  const [actionPlan, setActionPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGeneratePlan = async () => {
    if (!landSize || !budget) {
      toast.error('Please enter both land size and budget');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/action-plans`, {
        land_size: parseFloat(landSize),
        budget: parseFloat(budget),
        crop_type: 'Hybrid Tomato',
      });

      setActionPlan(response.data);
      toast.success('Action plan generated successfully!');
    } catch (error) {
      console.error('Error generating action plan:', error);
      toast.error('Failed to generate action plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Input Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6" data-testid="action-plan-form">
        <h3 className="text-xl font-medium text-slate-800 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Personalized Farmer Plan
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="landSize" className="text-slate-700 mb-2 flex items-center gap-2">
              <Sprout size={16} />
              Land Size (Acres)
            </Label>
            <Input
              id="landSize"
              type="number"
              placeholder="Enter land size"
              value={landSize}
              onChange={(e) => setLandSize(e.target.value)}
              data-testid="land-size-input"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="budget" className="text-slate-700 mb-2 flex items-center gap-2">
              <DollarSign size={16} />
              Budget (INR)
            </Label>
            <Input
              id="budget"
              type="number"
              placeholder="Enter budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              data-testid="budget-input"
              className="mt-1"
            />
          </div>
        </div>

        <Button
          onClick={handleGeneratePlan}
          disabled={loading}
          className="mt-6 bg-[#064E3B] hover:bg-[#065F46]"
          data-testid="generate-plan-button"
        >
          {loading ? 'Generating...' : 'Generate Action Plan'}
        </Button>
      </div>

      {/* Timeline/Gantt Chart */}
      {actionPlan && (
        <div className="bg-white rounded-xl border border-slate-200 p-6" data-testid="action-plan-timeline">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="text-[#064E3B]" size={24} />
            <h3 className="text-xl font-medium text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Farming Timeline - {actionPlan.crop_type}
            </h3>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div>
              <span className="text-sm text-slate-600">Land Size:</span>
              <span className="ml-2 font-semibold text-slate-900">{actionPlan.land_size} acres</span>
            </div>
            <div>
              <span className="text-sm text-slate-600">Budget:</span>
              <span className="ml-2 font-semibold text-slate-900">₹{actionPlan.budget.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-4">
            {actionPlan.timeline.map((item, index) => (
              <div
                key={index}
                className="flex gap-4 items-start"
                data-testid={`timeline-item-${index}`}
              >
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center font-semibold">
                    {item.week}
                  </div>
                  {index < actionPlan.timeline.length - 1 && (
                    <div className="w-0.5 h-16 bg-green-200 mt-2"></div>
                  )}
                </div>

                <div className="flex-1 pb-8">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-1">{item.task}</h4>
                    <p className="text-sm text-slate-600">{item.description}</p>
                    <div className="mt-2 text-xs text-slate-500">Week {item.week}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This timeline is optimized for {actionPlan.crop_type}. Adjust based on local weather conditions and soil test results.
            </p>
          </div>
        </div>
      )}

      {!actionPlan && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Sprout className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500">Enter your land size and budget to generate a personalized action plan</p>
        </div>
      )}
    </div>
  );
};

export default ActionPlan;