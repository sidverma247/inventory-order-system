import axios from 'axios'

// VITE_API_BASE_URL is injected at build time. When empty (the default), the
// app uses relative "/api" paths — handled by the Vite dev proxy locally and
// by the nginx reverse proxy / same-origin deploy in production.
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
  list: () => call(api.get('/api/products')),
  create: (payload) => call(api.post('/api/products', payload)),
  update: (id, payload) => call(api.put(`/api/products/${id}`, payload)),
  remove: (id) => call(api.delete(`/api/products/${id}`)),
}

export const CustomersAPI = {
  list: () => call(api.get('/api/customers')),
  create: (payload) => call(api.post('/api/customers', payload)),
  update: (id, payload) => call(api.put(`/api/customers/${id}`, payload)),
  remove: (id) => call(api.delete(`/api/customers/${id}`)),
}

export const OrdersAPI = {
  list: () => call(api.get('/api/orders')),
  create: (payload) => call(api.post('/api/orders', payload)),
}
