import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Globe, User, PlayCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:8001' : '');
const API = `${BACKEND_URL}/api`;

const Settings = ({ restartTour }) => {
  const [settings, setSettings] = useState({
    language: 'en',
    notifications_enabled: true,
    tour_completed: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings/guest`);
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSettings = async (updatedSettings) => {
    try {
      await axios.post(`${API}/settings`, {
        ...updatedSettings,
        user_id: 'guest',
      });
      setSettings(updatedSettings);
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const handleNotificationToggle = (enabled) => {
    updateSettings({ ...settings, notifications_enabled: enabled });
  };

  const handleRestartTour = () => {
    restartTour();
    toast.success('Tutorial restarted! Follow the guide.');
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Settings & Help
        </h2>
        <p className="text-sm text-slate-600 mt-1">Manage your preferences and get help</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6" data-testid="profile-settings">
        <div className="flex items-center gap-3 mb-6">
          <User className="text-[#064E3B]" size={24} />
          <h3 className="text-xl font-medium text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Profile Settings
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">User ID</p>
              <p className="text-sm text-slate-600">Guest User</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Account Type</p>
              <p className="text-sm text-slate-600">Free Tier</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6" data-testid="notification-settings">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="text-[#064E3B]" size={24} />
          <h3 className="text-xl font-medium text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Notifications
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <Label htmlFor="pest-alerts" className="font-medium text-slate-900 cursor-pointer">
                Pest Alerts
              </Label>
              <p className="text-sm text-slate-600">Get notified about pest outbreaks in your area</p>
            </div>
            <Switch
              id="pest-alerts"
              checked={settings.notifications_enabled}
              onCheckedChange={handleNotificationToggle}
              data-testid="pest-alerts-toggle"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <Label htmlFor="weather-alerts" className="font-medium text-slate-900 cursor-pointer">
                Weather Alerts
              </Label>
              <p className="text-sm text-slate-600">Receive weather warnings and monsoon predictions</p>
            </div>
            <Switch
              id="weather-alerts"
              checked={settings.notifications_enabled}
              onCheckedChange={handleNotificationToggle}
              data-testid="weather-alerts-toggle"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <Label htmlFor="price-updates" className="font-medium text-slate-900 cursor-pointer">
                Price Updates
              </Label>
              <p className="text-sm text-slate-600">Get notified when product prices drop</p>
            </div>
            <Switch
              id="price-updates"
              checked={settings.notifications_enabled}
              onCheckedChange={handleNotificationToggle}
              data-testid="price-updates-toggle"
            />
          </div>
        </div>
      </div>

      {/* App Guide */}
      <div className="bg-white rounded-xl border border-slate-200 p-6" data-testid="app-guide">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="text-[#064E3B]" size={24} />
          <h3 className="text-xl font-medium text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
            App Tutorial
          </h3>
        </div>

        <div className="space-y-4">
          <p className="text-slate-600">
            New to Verdant? Take a guided tour to learn about all the features and how to maximize your farm's productivity.
          </p>

          <Button
            onClick={handleRestartTour}
            size="lg"
            className="w-full bg-[#10B981] hover:bg-[#059669] text-lg py-6"
            data-testid="restart-tutorial-button"
          >
            <PlayCircle size={24} className="mr-2" />
            Restart App Tutorial / Open Guide
          </Button>
        </div>
      </div>

      {/* Help Resources */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-xl font-medium text-slate-800 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Help & Resources
        </h3>

        <div className="space-y-3">
          <a
            href="#"
            className="block p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <p className="font-medium text-slate-900">FAQs</p>
            <p className="text-sm text-slate-600">Find answers to common questions</p>
          </a>

          <a
            href="#"
            className="block p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <p className="font-medium text-slate-900">Contact Support</p>
            <p className="text-sm text-slate-600">Get help from our team</p>
          </a>

          <a
            href="#"
            className="block p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <p className="font-medium text-slate-900">Video Tutorials</p>
            <p className="text-sm text-slate-600">Watch step-by-step guides</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Settings;