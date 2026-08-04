import { authFetch } from '../config/api';
import type { CompanyDashboardStats } from '../types/company';

export function getCompanyStats() {
  return authFetch<CompanyDashboardStats>('/company/stats');
}
