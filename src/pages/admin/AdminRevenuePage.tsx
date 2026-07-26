import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

export function AdminRevenuePage() {
  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Revenus</h1>
      <p className="admin-page-subtitle">
        Suivi des revenus de la plateforme (commandes, commissions, pubs).
      </p>
      <div className="admin-page-card admin-coming-soon">
        <TrendingUp size={36} strokeWidth={1.75} />
        <h2>Module en préparation</h2>
        <p>
          Les revenus réels arriveront avec le système de commandes et de
          paiements. Pour l’instant, la valeur catalogue est visible sur le{' '}
          <Link to="/admin">dashboard</Link>.
        </p>
      </div>
    </div>
  );
}
