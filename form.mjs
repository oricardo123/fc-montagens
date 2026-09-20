export const isEndpoint = value => typeof value === 'string' && value === value.trim() && /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(value);
export function validate(values) {
  const errors = {};
  const limits = { name: 120, company: 160, email: 180, message: 2400 };
  for (const field of ['name','email','service','message']) {
    if (!String(values[field] || '').trim()) errors[field] = 'required';
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'email';
  if (values.service && !['1','2','3','4'].includes(values.service)) errors.service = 'required';
  for (const [field, max] of Object.entries(limits)) if (String(values[field] || '').length > max) errors[field] = 'long';
  return errors;
}
export async function submitRequest(endpoint, data, { fetcher = fetch, timeout = 15000 } = {}) {
  if (!isEndpoint(endpoint)) return 'demo';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetcher(endpoint, { method: 'POST', body: data, credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', headers: { Accept: 'application/json' }, signal: controller.signal });
    if (response.status === 429) return 'limit';
    if (!response.ok) return 'failed';
    const body = await response.json();
    return body.ok === true ? 'success' : 'failed';
  } catch { return 'network'; }
  finally { clearTimeout(timer); }
}
