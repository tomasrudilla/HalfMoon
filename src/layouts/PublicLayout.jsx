import { Outlet } from 'react-router-dom';
import SiteNav from '../components/SiteNav.jsx';
import Footer from '../components/Footer.jsx';
import WhatsAppWidget from '../components/WhatsAppWidget.jsx';
import { SettingsProvider } from '../context/SettingsContext.jsx';

export default function PublicLayout() {
  return (
    <SettingsProvider>
      <div className="landing-wrapper">
        <SiteNav />
        <Outlet />
        <Footer />
        <WhatsAppWidget />
      </div>
    </SettingsProvider>
  );
}
