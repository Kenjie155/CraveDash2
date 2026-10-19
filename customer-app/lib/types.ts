export type Restaurant = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  emoji: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  delivery_time_min: number;
  is_open: boolean;
  is_featured: boolean;
};

export type Category = {
  id: string;
  name: string;
  emoji: string | null;
  sort_order?: number;
};

export type MenuItem = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  original_price?: number | null;
  image_url: string | null;
  emoji: string | null;
  is_available: boolean;
  is_popular: boolean;
  rating?: number;
  review_count?: number;
  prep_time?: string;
  tag?: string;
  ingredients?: string[];
};

export type Rider = {
  id: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  vehicle_type: string;
  rating: number;
  completed_deliveries: number;
  base_fee: number;
  eta_minutes: number;
  is_available: boolean;
  last_lat?: number | null;
  last_lng?: number | null;
  last_location_at?: string | null;
};

export type Address = {
  id: string;
  label: string;
  address_line: string;
  latitude: number | null;
  longitude: number | null;
};

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'placed', label: 'Order placed' },
  { key: 'confirmed', label: 'Restaurant confirmed' },
  { key: 'preparing', label: 'Preparing food' },
  { key: 'ready_for_pickup', label: 'Ready for pickup' },
  { key: 'picked_up', label: 'Rider picked up' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
];

export type GeoCoordinate = {
  latitude: number;
  longitude: number;
};

export interface LandmarkPreset {
  id: string;
  name: string;
  description: string;
  coordinate: GeoCoordinate;
}

// Key reference landmarks in San Carlos City, Negros Occidental
export const SAN_CARLOS_LANDMARKS: LandmarkPreset[] = [
  {
    id: 'plaza',
    name: 'San Carlos City Hall & Public Plaza',
    description: 'City Center, San Carlos City',
    coordinate: { latitude: 10.4844, longitude: 123.4223 },
  },
  {
    id: 'market',
    name: 'San Carlos Public Market',
    description: 'Rizal & V. Gustilo St, San Carlos City',
    coordinate: { latitude: 10.4851, longitude: 123.4220 },
  },
  {
    id: 'hospital',
    name: "San Carlos Doctors' Hospital",
    description: 'National Highway, San Carlos City',
    coordinate: { latitude: 10.4802, longitude: 123.4158 },
  },
  {
    id: 'school',
    name: 'Julio Ledesma National High School',
    description: 'Ylagan Extension, San Carlos City',
    coordinate: { latitude: 10.4908, longitude: 123.4245 },
  },
  {
    id: 'port',
    name: 'Sipaway Port / Boulevard Park',
    description: 'Coastal Road, San Carlos City',
    coordinate: { latitude: 10.4879, longitude: 123.4282 },
  },
  {
    id: 'brgy1',
    name: 'Barangay I (Poblacion)',
    description: 'Barangay 1, San Carlos City',
    coordinate: { latitude: 10.4939, longitude: 123.4273 },
  },
  {
    id: 'brgy2',
    name: 'Barangay II',
    description: 'Barangay 2, San Carlos City',
    coordinate: { latitude: 10.4862, longitude: 123.4208 },
  },
  {
    id: 'brgy3',
    name: 'Barangay III',
    description: 'Barangay 3, San Carlos City',
    coordinate: { latitude: 10.4844, longitude: 123.4236 },
  },
  {
    id: 'brgy4',
    name: 'Barangay IV',
    description: 'Barangay 4, San Carlos City',
    coordinate: { latitude: 10.4815, longitude: 123.4190 },
  },
];
