import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ClipboardList, ShoppingCart, Settings, BookOpen, Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const Layout = ({ restartTour }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const navItems = [
    { path: '/', icon: Home, label: t('nav.dashboard'), tour: 'navigation' },
    { path: '/action-plan', icon: ClipboardList, label: t('nav.actionPlan') },
    { path: '/marketplace', icon: ShoppingCart, label: t('nav.marketplace'), tour: 'marketplace' },
    { path: '/guidebook', icon: BookOpen, label: 'Guidebook' },
    { path: '/help-and-settings', icon: Settings, label: t('nav.settings') },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#064E3B] text-white fixed h-full">
        <div className="p-6">
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Verdant
          </h1>
          <p className="text-green-200 text-sm mt-1">AgTech Platform</p>
        </div>

        <nav className="mt-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-tour={item.tour}
                data-testid={`nav-${item.path.replace('/', '') || 'dashboard'}`}
                className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                  isActive
                    ? 'bg-green-800 border-l-4 border-green-400'
                    : 'hover:bg-green-900'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <Globe size={20} className="text-slate-500" />
              <Select value={i18n.language} onValueChange={changeLanguage}>
                <SelectTrigger className="w-[140px]" data-testid="language-selector">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ta">Tamil</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;