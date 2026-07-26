import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';

export function AdminAnalyticsPage() {
  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Analytics</h1>
      <p className="admin-page-subtitle">
        Indicateurs de performance, tendances et conversion.
      </p>
      <div className="admin-page-card admin-coming-soon">
        <BarChart3 size={36} strokeWidth={1.75} />
        <h2>Module en préparation</h2>
        <p>
          Les graphiques détaillés arriveront après les événements produit /
          commande. Les statistiques actuelles sont déjà sur le{' '}
          <Link to="/admin">dashboard</Link>.
        </p>
      </div>
    </div>
  );
}
