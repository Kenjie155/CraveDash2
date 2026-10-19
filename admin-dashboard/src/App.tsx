import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './lib/toast';
import { configError, supabase } from './lib/supabase';
import Layout from './layouts/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import CrudPage, { type FieldDef } from './components/CrudPage';

const restaurantFields: FieldDef[] = [
  { key: 'name', label: 'Name', required: true }, { key: 'emoji', label: 'Emoji' },
  { key: 'description', label: 'Description', type: 'textarea' }, { key: 'image_url', label: 'Image URL', hideInList: true },
  { key: 'address', label: 'Address' }, { key: 'latitude', label: 'Latitude', type: 'number', hideInList: true },
  { key: 'longitude', label: 'Longitude', type: 'number', hideInList: true }, { key: 'rating', label: 'Rating (0-5)', type: 'number', step: '0.1' },
  { key: 'delivery_time_min', label: 'Delivery minutes', type: 'number', required: true },
  { key: 'is_open', label: 'Open', type: 'bool' }, { key: 'is_featured', label: 'Featured', type: 'bool' },
];
const menuFields: FieldDef[] = [
  { key: 'name', label: 'Name', required: true }, { key: 'restaurant_id', label: 'Restaurant', type: 'ref', ref: 'restaurants', required: true },
  { key: 'category_id', label: 'Category', type: 'ref', ref: 'food_categories' }, { key: 'price', label: 'Price (₱)', type: 'number', step: '0.01', required: true },
  { key: 'emoji', label: 'Emoji' }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'image_url', label: 'Image URL', hideInList: true },
  { key: 'is_available', label: 'Available', type: 'bool' }, { key: 'is_popular', label: 'Featured', type: 'bool' },
];
const categoryFields: FieldDef[] = [
  { key: 'name', label: 'Name', required: true }, { key: 'emoji', label: 'Emoji' }, { key: 'sort_order', label: 'Sort order', type: 'number' },
];
const riderFields: FieldDef[] = [
  { key: 'full_name', label: 'Full name', required: true }, { key: 'phone', label: 'Phone' }, { key: 'avatar_url', label: 'Photo URL', hideInList: true },
  { key: 'vehicle_type', label: 'Vehicle', required: true }, { key: 'rating', label: 'Rating (0-5)', type: 'number', step: '0.1' },
  { key: 'completed_deliveries', label: 'Deliveries', type: 'number' }, { key: 'base_fee', label: 'Delivery fee (₱)', type: 'number', step: '0.01', required: true },
  { key: 'eta_minutes', label: 'ETA minutes', type: 'number', required: true }, { key: 'is_available', label: 'Available', type: 'bool' },
  { key: 'last_lat', label: 'Last recorded latitude', type: 'number', hideInList: true }, { key: 'last_lng', label: 'Last recorded longitude', type: 'number', hideInList: true },
  { key: 'last_location_at', label: 'Recorded at (ISO time)', hideInList: true },
];

function Protected() {
  const { session, isAdmin, loading } = useAuth();
  if (loading) return <div className="center"><div className="state">Loading…</div></div>;
  if (!session) return <Login />;
  if (!isAdmin) return (
    <div className="center"><div className="card login">
      <h2>No admin access</h2><p>This account is not an administrator. Ask an existing admin to grant access in Supabase.</p>
      <button onClick={() => supabase.auth.signOut()}>Log out</button></div></div>
  );
  return <Layout />;
}

export default function App() {
  if (configError) return <div className="center"><div className="card login"><h2>Setup needed</h2><p>{configError}</p></div></div>;
  return (
    <AuthProvider><ToastProvider><BrowserRouter>
      <Routes>
        <Route element={<Protected />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="restaurants" element={<CrudPage table="restaurants" title="Restaurants" fields={restaurantFields} />} />
          <Route path="menu-items" element={<CrudPage table="menu_items" title="Menu items" fields={menuFields} />} />
          <Route path="categories" element={<CrudPage table="food_categories" title="Categories" fields={categoryFields} orderBy="sort_order" />} />
          <Route path="riders" element={<CrudPage table="riders" title="Riders" fields={riderFields} />} />
          <Route path="customers" element={<Customers />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter></ToastProvider></AuthProvider>
  );
}
