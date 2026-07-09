export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  access_status: 'free' | 'trial' | 'pro' | 'expired' | string;
  access_expires_at: string | null;
  created_at: string;
  trial_started_at: string | null;
}

export interface ProfileWithVehicleCount extends Profile {
  vehicles: [{ count: number }];
}

export interface Vehicle {
  id: string;
  user_id: string;
  catalog_id: string | null;
  custom_brand: string | null;
  custom_model: string | null;
  type: string;
  propulsion: string;
  plate: string | null;
  year: number | null;
  initial_odometer: number | null;
  battery_capacity_kwh: number | null;
  is_active: boolean;
  created_at: string;
  model_image: string | null;
  fuel_type: string | null;
  gasoline_subtype: string | null;
}

export interface PromoSplash {
  id: string;
  internal_title: string;
  image_url: string;
  start_date: string;
  end_date: string;
  frequency: 'always' | 'once_per_user';
  cta_text: string | null;
  cta_destination: string | null;
  learn_more_text: string | null;
  learn_more_url: string | null;
  status: 'draft' | 'active' | 'paused' | 'expired';
  created_at: string;
}
