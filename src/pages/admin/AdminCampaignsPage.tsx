import { Megaphone } from 'lucide-react';

export function AdminCampaignsPage() {
  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Campagnes sponsorisées</h1>
      <p className="admin-page-subtitle">
        Créez et suivez les campagnes promotionnelles des entreprises.
      </p>
      <div className="admin-page-card admin-coming-soon">
        <Megaphone size={36} strokeWidth={1.75} />
        <h2>Module en préparation</h2>
        <p>
          Ce module permettra de gérer bannières, mises en avant produits et
          campagnes sponsorisées. Les modèles de données seront ajoutés ensuite.
        </p>
      </div>
    </div>
  );
}
