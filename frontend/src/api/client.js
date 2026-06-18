import axios from 'axios'

// VITE_API_BASE_URL is injected at build time. When empty (the default), the
// app uses relative resource paths (/products, /orders, …) — handled by the
// Vite dev proxy locally and the nginx reverse proxy in the compose deploy.
// For split hosting (frontend on Vercel, backend on Render), set it to the
// absolute backend URL so requests go straight to the API.
const baseURL = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({ baseURL })

function unwrapError(err) {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return new Error(detail)
  if (Array.isArray(detail)) return new Error(detail.map((d) => d.msg).join(', '))
  return new Error(err.message || 'Request failed')
}

async function call(promise) {
  try {
    const { data } = await promise
    return data
  } catch (err) {
    throw unwrapError(err)
  }
}

export const ProductsAPI = {
  list: () => call(api.get('/products')),
  create: (payload) => call(api.post('/products', payload)),
  update: (id, payload) => call(api.put(`/products/${id}`, payload)),
  remove: (id) => call(api.delete(`/products/${id}`)),
}

export const CustomersAPI = {
  list: () => call(api.get('/customers')),
  create: (payload) => call(api.post('/customers', payload)),
  update: (id, payload) => call(api.put(`/customers/${id}`, payload)),
  remove: (id) => call(api.delete(`/customers/${id}`)),
}

export const OrdersAPI = {
  list: () => call(api.get('/orders')),
  create: (payload) => call(api.post('/orders', payload)),
  remove: (id) => call(api.delete(`/orders/${id}`)),
}

export const StatsAPI = {
  get: () => call(api.get('/stats')),
}
