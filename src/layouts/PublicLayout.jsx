import { Outlet } from 'react-router-dom';
import SiteNav from '../components/SiteNav.jsx';
import Footer from '../components/Footer.jsx';

export default function PublicLayout() {
  return (
    <div className="landing-wrapper">
      <SiteNav />
      <Outlet />
      <Footer />
    </div>
  );
}
