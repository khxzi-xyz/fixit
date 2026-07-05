import { Injectable } from '@nestjs/common';

export interface MaintenancePlan {
  plan_id: string;
  title: string;
  subtitle: string;
  category_id: string;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'BI_ANNUAL';
  price_omr: number;
  perks: string[];
  recommended_for: string;
}

export interface MaintenanceSubscription {
  subscription_id: string;
  user_id: string;
  plan_id: string;
  plan_title: string;
  next_visit_date: string;
  status: 'ACTIVE' | 'PAUSED';
  created_at: string;
}

const PLANS: MaintenancePlan[] = [
  {
    plan_id: 'm-ac-quarterly',
    title: 'AC Care & Chemical Wash',
    subtitle: '4x Complete Servicing per Year',
    category_id: 'AC_REPAIR',
    frequency: 'QUARTERLY',
    price_omr: 15.0,
    perks: ['Deep coil chemical wash', 'Gas pressure top-up', 'Thermostat inspection', 'Free emergency callout'],
    recommended_for: 'Villas & Apartments in Oman summer',
  },
  {
    plan_id: 'm-plumbing-monthly',
    title: 'Whole House Plumbing Guard',
    subtitle: 'Monthly Drain & Pressure Audit',
    category_id: 'PLUMBING',
    frequency: 'MONTHLY',
    price_omr: 9.5,
    perks: ['Water heater safety check', 'Main pump pressure test', 'Leak detection scanning', 'Priority replacement parts'],
    recommended_for: 'All residential homes',
  },
  {
    plan_id: 'm-villa-care',
    title: 'All-In-One Villa Guardian',
    subtitle: 'AC + Plumbing + Electrical + Pest',
    category_id: 'OTHER',
    frequency: 'QUARTERLY',
    price_omr: 29.0,
    perks: ['4x AC Servicing', '2x Electrical DB Board checks', '2x Pest control treatments', 'Dedicated Account Manager'],
    recommended_for: 'Large Villas & Luxury Properties',
  },
];

@Injectable()
export class MaintenanceService {
  private subscriptions: MaintenanceSubscription[] = [];

  getPlans(): MaintenancePlan[] {
    return PLANS;
  }

  subscribe(userId: string, planId: string): MaintenanceSubscription {
    const plan = PLANS.find((p) => p.plan_id === planId) ?? PLANS[0];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 14);

    const sub: MaintenanceSubscription = {
      subscription_id: `sub-${Date.now()}`,
      user_id: userId,
      plan_id: plan.plan_id,
      plan_title: plan.title,
      next_visit_date: nextDate.toISOString().split('T')[0],
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };

    this.subscriptions.unshift(sub);
    return sub;
  }

  getUserSubscriptions(userId: string): MaintenanceSubscription[] {
    return this.subscriptions.filter((s) => s.user_id === userId);
  }
}
