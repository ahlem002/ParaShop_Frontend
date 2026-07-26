import { Navigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { BestSellersSection } from '../components/home/BestSellersSection';
import { CategoriesSection } from '../components/home/CategoriesSection';
import { HeroSection } from '../components/home/HeroSection';
import { SearchSection } from '../components/home/SearchSection';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/home.css';

export function HomePage() {
  const { user } = useAuth();

  if (
    user?.role === 'COMPANY' &&
    user.companyVerificationStatus !== 'APPROVED'
  ) {
    return <Navigate to="/company/pending" replace />;
  }

  if (user?.role === 'COMPANY' && user.companyVerificationStatus === 'APPROVED') {
    return <Navigate to="/company" replace />;
  }

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <>
      <Navbar />
      <main className="container home-container">
        <HeroSection />
        <SearchSection />
        <CategoriesSection />
        <BestSellersSection />
      </main>
    </>
  );
}
