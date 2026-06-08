
// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyACbJZyxv3viMsrUsP1m4RHyIeSvAQU7Rw",
  authDomain: "tailor-pro-292fa.firebaseapp.com",
  projectId: "tailor-pro-292fa",
  storageBucket: "tailor-pro-292fa.firebasestorage.app",
  messagingSenderId: "832428606866",
  appId: "1:832428606866:web:e6310c55eece30203fad4b",
  measurementId: "G-W7QX9S7GQE"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();
// ============================================================
// TRANSLATIONS
// ============================================================
const translations = {
  en: {
    dashboard: "Dashboard", customers: "Customers", measurements: "Measurements",
    orders: "Orders", payments: "Payments", reports: "Reports", invoice: "Invoice",
    settings: "Settings", logout: "Logout", nav_main: "Main", nav_manage: "Management",
    nav_insights: "Insights", nav_system: "System", notifications: "Notifications",
    welcome_back: "Welcome back", dashboard_subtitle: "Here's what's happening at your shop",
    monthly_revenue: "Monthly Revenue", monthly_orders: "Monthly Orders",
    order_status: "Order Status", recent_customers: "Recent Customers",
    recent_orders: "Recent Orders", customers_subtitle: "Manage your customer database",
    total_customers: "Total Customers", total_orders: "Total Orders",
    active_orders: "Active Orders", ready_orders: "Ready to Deliver",
    delivered_orders: "Delivered", total_revenue: "Total Revenue",
    pending_payments: "Pending Payments"
  },
  ru: {
    dashboard: "Dashboard", customers: "Customers", measurements: "Measurements",
    orders: "Orders", payments: "Payments", reports: "Reports", invoice: "Invoice",
    settings: "Settings", logout: "Logout", nav_main: "Main",
    nav_manage: "Management", nav_insights: "Insights", nav_system: "System",
    notifications: "Notifications", welcome_back: "Khush Aamdeed",
    dashboard_subtitle: "Aaj ki report dekhen",
    monthly_revenue: "Mahana Kamai", monthly_orders: "Mahane ke Orders",
    order_status: "Order ki Halat", recent_customers: "Naye Customers",
    recent_orders: "Naye Orders", customers_subtitle: "Customer database manage karo",
    total_customers: "Kul Customers", total_orders: "Kul Orders",
    active_orders: "Active Orders", ready_orders: "Delivery Ready",
    delivered_orders: "Deliver Ho Gaye", total_revenue: "Kul Kamai",
    pending_payments: "Baqi Payments"
  }
};

// ============================================================
// APP STATE
// ============================================================
let currentLang = localStorage.getItem('lang') || 'en';
let currentTheme = localStorage.getItem('theme') || 'dark';
let currentUser = null;
let currentPage = 'dashboard';
let editingId = null;
let viewingCustomerId = null;
let confirmCallback = null;
let orderViewMode = 'table';
let searchQuery = '';

// ============================================================
// DEMO DATA
// ============================================================
let db = {
  users: {},
  customers: [],
  orders: [],
  payments: [],
  measurements: []
};


function saveDB() {
  if (!currentUser) return;
  firestore.collection('users').doc(currentUser.uid).set({
    customers: db.customers,
    orders: db.orders,
    payments: db.payments,
    measurements: db.measurements
  }, { merge: true });
}
function loadDB() {
  if (!currentUser) return;
  return firestore.collection('users').doc(currentUser.uid).get()
    .then(doc => {
      if (doc.exists) {
        const data = doc.data();
        db.customers    = data.customers    || [];
        db.orders       = data.orders       || [];
        db.payments     = data.payments     || [];
        db.measurements = data.measurements || [];
        db.users[currentUser.uid] = {
          name:     data.name     || '',
          email:    data.email    || '',
          shopName: data.shopName || '',
          phone:    data.phone    || '',
          address:  data.address  || ''
        };
      }
    });
}

// ============================================================
// AUTH
// ============================================================
  
function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;
  if (!email || !pass) { toast('Please fill all fields', 'error'); return; }

  auth.signInWithEmailAndPassword(email, pass)
    .then(result => {
      currentUser = { uid: result.user.uid, email: result.user.email };
      launchApp();
    })
    .catch(err => {
      toast('Login failed: ' + err.message, 'error');
    });
}

function doSignup() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass = document.getElementById('signup-password').value;
  const shop = document.getElementById('signup-shop').value.trim();
  if (!name || !email || !pass || !shop) { toast('Please fill all fields', 'error'); return; }
  if (pass.length < 8) { toast('Password must be at least 8 characters', 'error'); return; }

  auth.createUserWithEmailAndPassword(email, pass)
    .then(result => {
      const uid = result.user.uid;
      currentUser = { uid, email };
      // User ka data Firestore mein save karo
      return firestore.collection('users').doc(uid).set({
        name, email, shopName: shop, phone: '', address: '',
        createdAt: new Date().toISOString()
      });
    })
    .then(() => {
      toast('Account created!', 'success');
      launchApp();
    })
    .catch(err => {
      toast('Signup failed: ' + err.message, 'error');
    });
}


function doForgotPassword() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email) { toast('Please enter your email', 'error'); return; }

  auth.sendPasswordResetEmail(email)
    .then(() => {
      toast('Reset email bhej diya! Inbox check karo', 'success');
    })
    .catch(err => {
      toast('Error: ' + err.message, 'error');
    });
}
function doLogout() {
  auth.signOut().then(() => {
    currentUser = null;
    db = { users:{}, customers:[], orders:[], payments:[], measurements:[] };
    document.getElementById('app').classList.remove('show');
    const _mbn = document.getElementById('mobile-bottom-nav');
    if (_mbn) _mbn.style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
    toast('Logged out successfully', 'info');
  });
}
function switchAuthTab(tab) {
  ['login','signup','forgot'].forEach(t => {
    document.getElementById('form-' + t).style.display = t === tab ? 'block' : 'none';
    const tabEl = document.getElementById('tab-' + t);
    if (tabEl) tabEl.classList.toggle('active', t === tab);
  });
}
function launchApp() {
  loadDB().then(() => {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app').classList.add('show');
    const _mbn2 = document.getElementById('mobile-bottom-nav');
    if (_mbn2) _mbn2.style.removeProperty('display');
    const user = db.users[currentUser.uid] || {};
    document.getElementById('sidebar-user-name').textContent = user.name || 'User';
    document.getElementById('sidebar-user-email').textContent = currentUser.email;
    document.getElementById('sidebar-user-avatar').textContent = (user.name || 'U')[0].toUpperCase();
    document.getElementById('dash-user-name').textContent = (user.name || 'User').split(' ')[0];
    document.getElementById('shop-name-display').textContent = user.shopName || 'My Shop';
    applyTheme(currentTheme);
    applyLang(currentLang);
    loadSettings();
    navigateTo('dashboard');
    generateNotifications();
  });
}

// ============================================================
// NAVIGATION
// ============================================================
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');
  currentPage = page;
  closeSidebar();
  // Update mobile bottom nav active state
  document.querySelectorAll('.mbn-item').forEach(el => {
    el.classList.toggle('mbn-active', el.getAttribute('data-mbn') === page);
  });
  if (page === 'dashboard') renderDashboard();
  else if (page === 'customers') renderCustomers();
  else if (page === 'measurements') renderMeasurements();
  else if (page === 'orders') renderOrders();
  else if (page === 'payments') renderPayments();
  else if (page === 'reports') renderReports();
  else if (page === 'invoice') renderInvoicePage();
  else if (page === 'settings') loadSettings();
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  const total = db.customers.length;
  const totalOrders = db.orders.length;
  const active = db.orders.filter(o => ['pending','cutting','stitching'].includes(o.status)).length;
  const ready = db.orders.filter(o => o.status === 'ready').length;
  const delivered = db.orders.filter(o => o.status === 'delivered').length;
  const revenue = db.payments.reduce((s, p) => s + (p.amount || 0), 0);
  const pending = db.orders.reduce((s, o) => s + (o.remaining || 0), 0);
  document.getElementById('active-orders-badge').textContent = active;
  const stats = [
    { label: t('total_customers'), value: total, icon: '👥', color: 'purple', change: '+2 this week', up: true },
    { label: t('total_orders'), value: totalOrders, icon: '🧵', color: 'gold', change: '+3 this week', up: true },
    { label: t('active_orders'), value: active, icon: '⚡', color: 'blue', change: `${ready} ready`, up: true },
    { label: t('delivered_orders'), value: delivered, icon: '✅', color: 'teal', change: 'All time', up: true },
    { label: t('total_revenue'), value: '₨ ' + revenue.toLocaleString(), icon: '💰', color: 'gold', change: '+12% vs last month', up: true },
    { label: t('pending_payments'), value: '₨ ' + pending.toLocaleString(), icon: '⏳', color: 'rose', change: `${db.orders.filter(o=>o.remaining>0).length} orders`, up: false }
  ];
  document.getElementById('dashboard-stats').innerHTML = stats.map(s => `
    <div class="stat-card ${s.color}">
      <div class="stat-icon">${s.icon}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-change ${s.up ? 'up' : 'down'}">${s.up ? '↑' : '↓'} ${s.change}</div>
    </div>`).join('');

  // Recent customers
  const rc = db.customers.slice(-4).reverse();
  document.getElementById('recent-customers-list').innerHTML = rc.length ? rc.map(c => `
    <div class="flex items-center gap-3" style="padding:10px 0;border-bottom:1px solid var(--border)">
      <div class="user-avatar" style="width:32px;height:32px;font-size:.8rem;border-radius:8px">${c.name[0]}</div>
      <div style="flex:1"><div style="font-size:.87rem;font-weight:600">${c.name}</div><div class="text-xs text-muted">${c.phone}</div></div>
      <div class="text-xs text-muted">${c.city}</div>
    </div>`).join('') : '<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">No customers yet</div></div>';

  // Recent orders
  const ro = db.orders.slice(-4).reverse();
  document.getElementById('recent-orders-list').innerHTML = ro.length ? ro.map(o => {
    const cust = db.customers.find(c => c.id === o.customerId);
    return `<div class="flex items-center gap-3" style="padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="flex:1"><div style="font-size:.87rem;font-weight:600">${cust ? cust.name : 'Unknown'}</div><div class="text-xs text-muted">${o.dressType}</div></div>
      <div class="text-xs" style="text-align:right"><span class="badge badge-${o.status}">${statusLabel(o.status)}</span><div class="text-muted mt-2" style="margin-top:4px">₨ ${o.price.toLocaleString()}</div></div>
    </div>`;
  }).join('') : '<div class="empty-state"><div class="empty-icon">🧵</div><div class="empty-title">No orders yet</div></div>';

  renderCharts();
}

let chartInstances = {};
function destroyChart(id) {
  if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

function renderCharts() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun'];
  const accent = '#7c6af7', gold = '#f0b429', teal = '#06d6a0', rose = '#ef4565';
  const gridColor = currentTheme === 'dark' ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
  const tickColor = currentTheme === 'dark' ? '#6a6a82' : '#8888a8';

  destroyChart('rev'); destroyChart('ord'); destroyChart('stat');
  // Build real monthly data from db
  const now = new Date();
  const revenueData = months.map((_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return db.payments.filter(p => {
      const d = new Date(p.createdAt || p.date);
      return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
    }).reduce((s, p) => s + p.amount, 0);
  });
  const ordersData = months.map((_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return db.orders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
    }).length;
  });

  const baseOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } },
      y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } }
    }
  };

  chartInstances['rev'] = new Chart(document.getElementById('chart-revenue').getContext('2d'), {
    type: 'bar', data: {
      labels: months,
      datasets: [{ data: revenueData, backgroundColor: accent + '55', borderColor: accent, borderWidth: 2, borderRadius: 6 }]
    }, options: { ...baseOpts, plugins: { legend: { display: false } } }
  });

  chartInstances['ord'] = new Chart(document.getElementById('chart-orders').getContext('2d'), {
    type: 'line', data: {
      labels: months,
      datasets: [{ data: ordersData, borderColor: gold, backgroundColor: gold + '22', borderWidth: 2.5, tension: .4, pointBackgroundColor: gold, pointRadius: 4, fill: true }]
    }, options: { ...baseOpts }
  });

  const statusCounts = ['pending','cutting','stitching','ready','delivered'].map(s => db.orders.filter(o => o.status === s).length);
  chartInstances['stat'] = new Chart(document.getElementById('chart-status').getContext('2d'), {
    type: 'doughnut', data: {
      labels: ['Pending','Cutting','Stitching','Ready','Delivered'],
      datasets: [{ data: statusCounts, backgroundColor: [gold+'cc', '#4ecdc4cc', accent+'cc', teal+'cc', '#a0a0b8cc'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: tickColor, font: { size: 10 }, padding: 8, boxWidth: 10 } } } }
  });
}

// ============================================================
// CUSTOMERS
// ============================================================
function renderCustomers(filter = '') {
  let list = db.customers;
  if (filter) list = list.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()) || c.phone.includes(filter) || c.city.toLowerCase().includes(filter));
  const cities = [...new Set(db.customers.map(c => c.city).filter(Boolean))];
  const cityFilter = document.getElementById('city-filter');
  const current = cityFilter.value;
  cityFilter.innerHTML = '<option value="">All Cities</option>' + cities.map(c => `<option value="${c}" ${c === current ? 'selected' : ''}>${c}</option>`).join('');
  if (current) list = list.filter(c => c.city === current);
  const tbody = document.getElementById('customers-tbody');
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">No customers found</div><div class="empty-desc">Add your first customer to get started</div><button class="btn btn-primary" onclick="openModal('modal-add-customer')">+ Add Customer</button></div></td></tr>`; return; }
  tbody.innerHTML = list.map(c => {
    const orders = db.orders.filter(o => o.customerId === c.id);
    const spent = db.payments.filter(p => p.customerId === c.id).reduce((s, p) => s + p.amount, 0);
    return `<tr>
      <td><div class="flex items-center gap-2"><div class="user-avatar" style="width:30px;height:30px;font-size:.75rem;border-radius:7px">${c.name[0]}</div><div><div style="font-weight:600;font-size:.88rem">${c.name}</div><div class="text-xs text-muted">${c.address || ''}</div></div></div></td>
      <td><a href="https://wa.me/92${c.phone.replace(/^0/, '')}" target="_blank" style="color:var(--teal)">📱 ${c.phone}</a></td>
      <td>${c.city || '—'}</td>
      <td><span style="font-weight:600">${orders.length}</span></td>
      <td style="font-family:'JetBrains Mono',monospace">₨ ${spent.toLocaleString()}</td>
      <td class="text-muted text-xs">${formatDate(c.createdAt)}</td>
      <td><div class="td-actions">
        <button class="btn btn-xs btn-secondary" onclick="viewCustomer('${c.id}')">👁️ View</button>
        <button class="btn btn-xs btn-secondary" onclick="editCustomer('${c.id}')">✏️</button>
        <button class="btn btn-xs btn-danger" onclick="deleteCustomer('${c.id}')">🗑️</button>
      </div></td>
    </tr>`;
  }).join('');
}
function filterCustomers(v) { renderCustomers(v); }
function filterCustomersByCity(v) { renderCustomers(); }
function saveCustomer() {
  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  if (!name || !phone) { toast('Name and phone are required', 'error'); return; }
  if (editingId) {
    const i = db.customers.findIndex(c => c.id === editingId);
    if (i > -1) Object.assign(db.customers[i], { name, phone, city: document.getElementById('cust-city').value, address: document.getElementById('cust-address').value, notes: document.getElementById('cust-notes').value });
    toast('Customer updated', 'success');
  } else {
    db.customers.push({ id: 'c' + Date.now(), name, phone, city: document.getElementById('cust-city').value, address: document.getElementById('cust-address').value, notes: document.getElementById('cust-notes').value, createdAt: new Date().toISOString() });
    toast('Customer added', 'success');
  }
  saveDB(); closeModal('modal-add-customer'); editingId = null;
  clearForm(['cust-name','cust-phone','cust-city','cust-address','cust-notes']);
  renderCustomers();
}
function editCustomer(id) {
  const c = db.customers.find(x => x.id === id);
  if (!c) return;
  editingId = id;
  document.getElementById('cust-name').value = c.name;
  document.getElementById('cust-phone').value = c.phone;
  document.getElementById('cust-city').value = c.city || '';
  document.getElementById('cust-address').value = c.address || '';
  document.getElementById('cust-notes').value = c.notes || '';
  openModal('modal-add-customer');
}
function deleteCustomer(id) {
  showConfirm('Delete this customer? All related orders and payments will also be removed.', () => {
    db.customers = db.customers.filter(c => c.id !== id);
    db.orders = db.orders.filter(o => o.customerId !== id);
    db.payments = db.payments.filter(p => p.customerId !== id);
    db.measurements = db.measurements.filter(m => m.customerId !== id);
    saveDB(); renderCustomers(); toast('Customer deleted', 'success');
  });
}
function viewCustomer(id) {
  viewingCustomerId = id;
  const c = db.customers.find(x => x.id === id);
  if (!c) return;
  navigateTo('customer-profile');
  const orders = db.orders.filter(o => o.customerId === id);
  const payments = db.payments.filter(p => p.customerId === id);
  const spent = payments.reduce((s, p) => s + p.amount, 0);
  const meas = db.measurements.find(m => m.customerId === id);
  // Profile header
  document.getElementById('profile-header').innerHTML = `
    <div class="profile-avatar">${c.name[0]}</div>
    <div class="profile-info" style="flex:1">
      <h2>${c.name}</h2>
      <p>Customer since ${formatDate(c.createdAt)}</p>
      <div class="profile-meta">
        <div class="profile-meta-item">📱 ${c.phone}</div>
        <div class="profile-meta-item">🏙️ ${c.city || 'N/A'}</div>
        <div class="profile-meta-item">📦 ${orders.length} Orders</div>
        <div class="profile-meta-item">💰 ₨ ${spent.toLocaleString()} Spent</div>
      </div>
    </div>
    <div class="flex gap-2" style="flex-wrap:wrap">
      <a href="https://wa.me/92${c.phone.replace(/^0/, '')}" target="_blank" class="wa-btn">💬 WhatsApp</a>
      <button class="btn btn-secondary" onclick="editCustomer('${c.id}')">✏️ Edit</button>
      <button class="btn btn-primary" onclick="openAddOrderForCustomer('${c.id}')">+ Order</button>
    </div>`;
  // Info section
  document.getElementById('profile-info').innerHTML = `
    <div class="card"><div class="form-grid">
      <div><div class="form-label">Full Name</div><div style="font-weight:600">${c.name}</div></div>
      <div><div class="form-label">Phone</div><div style="font-weight:600">${c.phone}</div></div>
      <div><div class="form-label">City</div><div style="font-weight:600">${c.city || '—'}</div></div>
      <div><div class="form-label">Address</div><div style="font-weight:600">${c.address || '—'}</div></div>
      <div class="full"><div class="form-label">Notes</div><div style="font-weight:600">${c.notes || '—'}</div></div>
    </div></div>`;
  // Measurements section
  document.getElementById('profile-measurements').innerHTML = meas ? `
    <div class="card" style="margin-bottom:12px">
      <div class="card-header"><div class="card-title">🧥 Shalwar Kameez</div><button class="btn btn-sm btn-secondary" onclick="editMeasurementForCustomer('${id}')">✏️ Edit</button></div>
      <div class="measure-grid">${Object.entries(meas.sk).map(([k,v]) => `<div class="measure-item"><div class="measure-value">${v}"</div><div class="measure-label">${k.charAt(0).toUpperCase()+k.slice(1)}</div></div>`).join('')}</div>
    </div>
    <div class="card" style="margin-bottom:12px"><div class="card-header"><div class="card-title">👖 Pant</div></div>
      <div class="measure-grid">${Object.entries(meas.pant).map(([k,v]) => `<div class="measure-item"><div class="measure-value">${v}"</div><div class="measure-label">${k.charAt(0).toUpperCase()+k.slice(1)}</div></div>`).join('')}</div>
    </div>` :
    `<div class="empty-state"><div class="empty-icon">📐</div><div class="empty-title">No measurements</div><button class="btn btn-primary" onclick="openMeasurementForCustomer('${id}')">+ Add Measurements</button></div>`;
  // Orders section
  document.getElementById('profile-orders').innerHTML = orders.length ? `
    <div class="table-wrap"><table><thead><tr><th>Dress Type</th><th>Price</th><th>Advance</th><th>Balance</th><th>Status</th><th>Delivery</th></tr></thead>
    <tbody>${orders.map(o => `<tr><td>${o.dressType}</td><td>₨ ${o.price.toLocaleString()}</td><td>₨ ${o.advance.toLocaleString()}</td><td>₨ ${o.remaining.toLocaleString()}</td><td><span class="badge badge-${o.status}">${statusLabel(o.status)}</span></td><td>${o.deliveryDate}</td></tr>`).join('')}</tbody></table></div>` :
    '<div class="empty-state"><div class="empty-icon">🧵</div><div class="empty-title">No orders yet</div></div>';
  // Payments section
  document.getElementById('profile-payments').innerHTML = payments.length ? `
    <div class="table-wrap"><table><thead><tr><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
    <tbody>${payments.map(p => `<tr><td style="font-weight:700;color:var(--teal)">₨ ${p.amount.toLocaleString()}</td><td>${p.method}</td><td>${p.date}</td></tr>`).join('')}</tbody></table></div>` :
    '<div class="empty-state"><div class="empty-icon">💳</div><div class="empty-title">No payments recorded</div></div>';
  // Reset tabs
  document.querySelectorAll('.profile-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  document.querySelectorAll('.profile-section').forEach((s, i) => s.classList.toggle('active', i === 0));
}
function switchProfileTab(tab) {
  const tabs = ['info','measurements','orders','payments'];
  const idx = tabs.indexOf(tab);
  document.querySelectorAll('.profile-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
  document.querySelectorAll('.profile-section').forEach((s, i) => s.classList.toggle('active', i === idx));
}
function openAddOrderForCustomer(id) {
  populateOrderCustomers();
  document.getElementById('order-customer').value = id;
  openModal('modal-add-order');
}
function openMeasurementForCustomer(id) {
  populateMeasurementCustomers();
  document.getElementById('meas-customer').value = id;
  openModal('modal-add-measurement');
}
function editMeasurementForCustomer(id) {
  openMeasurementForCustomer(id);
  const m = db.measurements.find(x => x.customerId === id);
  if (m) {
    const fill = (prefix, obj) => Object.entries(obj).forEach(([k, v]) => { const el = document.getElementById(prefix + k); if (el) el.value = v; });
    fill('m-sk-', m.sk); fill('m-p-', m.pant); fill('m-c-', m.coat);
  }
}

// ============================================================
// MEASUREMENTS
// ============================================================
function renderMeasurements(filter = '') {
  let list = db.measurements;
  if (filter) {
    list = list.filter(m => {
      const c = db.customers.find(x => x.id === m.customerId);
      return c && c.name.toLowerCase().includes(filter.toLowerCase());
    });
  }
  const grid = document.getElementById('measurements-grid');
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📐</div><div class="empty-title">No measurements yet</div><div class="empty-desc">Add customer measurements to track them</div></div>`;
    return;
  }
  grid.innerHTML = list.map(m => {
    const c = db.customers.find(x => x.id === m.customerId);
    return `<div class="card">
      <div class="card-header">
        <div class="card-title">${c ? c.name : 'Unknown'}</div>
        <div class="flex gap-2">
          <button class="btn btn-xs btn-secondary" onclick="editMeasurementForCustomer('${m.customerId}')">✏️</button>
          <button class="btn btn-xs btn-danger" onclick="deleteMeasurement('${m.id}')">🗑️</button>
        </div>
      </div>
      <div style="font-size:.75rem;font-weight:700;color:var(--text3);text-transform:uppercase;margin-bottom:8px">🧥 Shalwar Kameez</div>
      <div class="measure-grid" style="grid-template-columns:repeat(3,1fr);gap:8px">
        ${Object.entries(m.sk).slice(0,6).map(([k,v]) => `<div class="measure-item"><div class="measure-value" style="font-size:1rem">${v}"</div><div class="measure-label" style="font-size:.65rem">${k.charAt(0).toUpperCase()+k.slice(1)}</div></div>`).join('')}
      </div>
      <div class="text-xs text-muted mt-4" style="margin-top:10px">Updated ${formatDate(m.updatedAt)}</div>
    </div>`;
  }).join('');
}
function filterMeasurements(v) { renderMeasurements(v); }
function populateMeasurementCustomers() {
  const sel = document.getElementById('meas-customer');
  sel.innerHTML = '<option value="">Select customer...</option>' + db.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}
function saveMeasurement() {
  const custId = document.getElementById('meas-customer').value;
  if (!custId) { toast('Please select a customer', 'error'); return; }
  const gv = id => parseFloat(document.getElementById(id).value) || 0;
  const mData = {
    customerId: custId,
    sk: { chest: gv('m-sk-chest'), shoulder: gv('m-sk-shoulder'), sleeve: gv('m-sk-sleeve'), neck: gv('m-sk-neck'), length: gv('m-sk-length'), waist: gv('m-sk-waist') },
    pant: { waist: gv('m-p-waist'), hip: gv('m-p-hip'), length: gv('m-p-length'), bottom: gv('m-p-bottom') },
    coat: { chest: gv('m-c-chest'), shoulder: gv('m-c-shoulder'), sleeve: gv('m-c-sleeve'), length: gv('m-c-length') },
    updatedAt: new Date().toISOString()
  };
  const existing = db.measurements.findIndex(m => m.customerId === custId);
  if (existing > -1) { db.measurements[existing] = { ...db.measurements[existing], ...mData }; }
  else { db.measurements.push({ id: 'm' + Date.now(), ...mData }); }
  saveDB(); closeModal('modal-add-measurement'); toast('Measurements saved', 'success'); renderMeasurements();
}
function deleteMeasurement(id) {
  showConfirm('Delete these measurements?', () => {
    db.measurements = db.measurements.filter(m => m.id !== id);
    saveDB(); renderMeasurements(); toast('Measurements deleted', 'success');
  });
}

// ============================================================
// ORDERS
// ============================================================
function renderOrders(filter = '', statusF = '', dressF = '') {
  let list = db.orders;
  if (filter) list = list.filter(o => {
    const c = db.customers.find(x => x.id === o.customerId);
    return (c && c.name.toLowerCase().includes(filter.toLowerCase())) || o.dressType.toLowerCase().includes(filter.toLowerCase()) || o.id.includes(filter);
  });
  if (statusF) list = list.filter(o => o.status === statusF);
  if (dressF) list = list.filter(o => o.dressType === dressF);
  if (orderViewMode === 'table') renderOrderTable(list);
  else renderKanban();
}
function renderOrderTable(list) {
  const tbody = document.getElementById('orders-tbody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">🧵</div><div class="empty-title">No orders found</div><button class="btn btn-primary" onclick="openModal('modal-add-order')">+ Create Order</button></div></td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(o => {
    const c = db.customers.find(x => x.id === o.customerId);
    const late = new Date(o.deliveryDate) < new Date() && o.status !== 'delivered';
    return `<tr>
      <td class="font-mono text-xs text-muted">#${o.id}</td>
      <td><div style="font-weight:600;font-size:.88rem">${c ? c.name : 'Unknown'}</div><div class="text-xs text-muted">${c ? c.phone : ''}</div></td>
      <td>${o.dressType}<div class="text-xs text-muted">Qty: ${o.quantity} · ${o.fabric || 'N/A'}</div></td>
      <td><div style="font-size:.85rem;${late ? 'color:var(--rose);font-weight:600' : ''}">${o.deliveryDate}${late ? ' ⚠️' : ''}</div></td>
      <td class="font-mono">₨ ${o.price.toLocaleString()}</td>
      <td class="font-mono text-success">₨ ${o.advance.toLocaleString()}</td>
      <td class="font-mono ${o.remaining > 0 ? 'text-warning' : 'text-success'}">₨ ${o.remaining.toLocaleString()}</td>
      <td>
        <select class="filter-select" style="padding:5px 8px;font-size:.78rem" onchange="updateOrderStatus('${o.id}', this.value)">
          ${['pending','cutting','stitching','ready','delivered'].map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${statusLabel(s)}</option>`).join('')}
        </select>
      </td>
      <td><div class="td-actions">
        <button class="btn btn-xs btn-secondary" onclick="editOrder('${o.id}')">✏️</button>
        <button class="btn btn-xs btn-success" onclick="openPaymentForOrder('${o.id}')">💳</button>
        <button class="btn btn-xs btn-danger" onclick="deleteOrder('${o.id}')">🗑️</button>
      </div></td>
    </tr>`;
  }).join('');
}
function renderKanban() {
  const cols = ['pending','cutting','stitching','ready','delivered'];
  const colColors = { pending: '#f0b429', cutting: '#4ecdc4', stitching: '#7c6af7', ready: '#06d6a0', delivered: '#a0a0b8' };
  document.getElementById('kanban-board').innerHTML = cols.map(status => {
    const orders = db.orders.filter(o => o.status === status);
    return `<div class="kanban-col" ondragover="event.preventDefault()" ondrop="dropOrder(event,'${status}')">
      <div class="kanban-col-header">
        <div class="kanban-col-title" style="color:${colColors[status]}">${statusLabel(status)}</div>
        <div class="kanban-col-count">${orders.length}</div>
      </div>
      ${orders.map(o => {
        const c = db.customers.find(x => x.id === o.customerId);
        return `<div class="kanban-card" draggable="true" ondragstart="dragOrder(event,'${o.id}')">
          <div class="kanban-card-title">${c ? c.name : 'Unknown'}</div>
          <div class="kanban-card-meta">
            <span>🧥 ${o.dressType}</span>
            <span>📅 ${o.deliveryDate}</span>
            <span>₨ ${o.price.toLocaleString()}</span>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }).join('');
}
let draggingOrderId = null;
function dragOrder(e, id) { draggingOrderId = id; e.dataTransfer.setData('text', id); }
function dropOrder(e, status) {
  e.preventDefault();
  const id = draggingOrderId || e.dataTransfer.getData('text');
  const o = db.orders.find(x => x.id === id);
  if (o) { o.status = status; saveDB(); renderKanban(); toast('Order moved to ' + statusLabel(status), 'info'); }
}
function setOrderView(mode) {
  orderViewMode = mode;
  document.getElementById('orders-table-view').style.display = mode === 'table' ? 'block' : 'none';
  document.getElementById('orders-kanban-view').style.display = mode === 'kanban' ? 'block' : 'none';
  document.getElementById('btn-view-table').classList.toggle('btn-primary', mode === 'table');
  document.getElementById('btn-view-kanban').classList.toggle('btn-primary', mode === 'kanban');
  document.getElementById('btn-view-table').classList.toggle('btn-secondary', mode !== 'table');
  document.getElementById('btn-view-kanban').classList.toggle('btn-secondary', mode !== 'kanban');
  renderOrders();
}
function populateOrderCustomers() {
  const sel = document.getElementById('order-customer');
  sel.innerHTML = '<option value="">Select customer...</option>' + db.customers.map(c => `<option value="${c.id}">${c.name} — ${c.phone}</option>`).join('');
}
function calcRemaining() {
  const price = parseFloat(document.getElementById('order-price').value) || 0;
  const advance = parseFloat(document.getElementById('order-advance').value) || 0;
  document.getElementById('order-remaining').value = Math.max(0, price - advance);
}
function saveOrder() {
  const custId = document.getElementById('order-customer').value;
  const dressType = document.getElementById('order-dress').value;
  const price = parseFloat(document.getElementById('order-price').value) || 0;
  const deliveryDate = document.getElementById('order-delivery').value;
  if (!custId || !dressType || !price || !deliveryDate) { toast('Please fill required fields', 'error'); return; }
  const advance = parseFloat(document.getElementById('order-advance').value) || 0;
  const oData = {
    customerId: custId, dressType, quantity: parseInt(document.getElementById('order-qty').value) || 1,
    fabric: document.getElementById('order-fabric').value, color: document.getElementById('order-color').value,
    price, advance, remaining: Math.max(0, price - advance), status: document.getElementById('order-status').value,
    deliveryDate, notes: document.getElementById('order-notes').value
  };
  if (editingId) {
    const i = db.orders.findIndex(o => o.id === editingId);
    if (i > -1) db.orders[i] = { ...db.orders[i], ...oData };
    toast('Order updated', 'success');
  } else {
    db.orders.push({ id: 'o' + Date.now(), ...oData, createdAt: new Date().toISOString() });
    if (advance > 0) {
      db.payments.push({ id: 'p' + Date.now(), customerId: custId, orderId: db.orders[db.orders.length-1].id, amount: advance, method: 'Cash', date: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() });
    }
    toast('Order created', 'success');
  }
  saveDB(); closeModal('modal-add-order'); editingId = null;
  clearForm(['order-fabric','order-color','order-notes','order-price','order-advance','order-remaining']);
  renderOrders();
  document.getElementById('active-orders-badge').textContent = db.orders.filter(o => ['pending','cutting','stitching'].includes(o.status)).length;
}
function editOrder(id) {
  const o = db.orders.find(x => x.id === id);
  if (!o) return;
  editingId = id;
  populateOrderCustomers();
  document.getElementById('order-customer').value = o.customerId;
  document.getElementById('order-dress').value = o.dressType;
  document.getElementById('order-qty').value = o.quantity;
  document.getElementById('order-fabric').value = o.fabric || '';
  document.getElementById('order-color').value = o.color || '';
  document.getElementById('order-delivery').value = o.deliveryDate;
  document.getElementById('order-price').value = o.price;
  document.getElementById('order-advance').value = o.advance;
  document.getElementById('order-remaining').value = o.remaining;
  document.getElementById('order-status').value = o.status;
  document.getElementById('order-notes').value = o.notes || '';
  openModal('modal-add-order');
}
function deleteOrder(id) {
  showConfirm('Delete this order?', () => {
    db.orders = db.orders.filter(o => o.id !== id);
    db.payments = db.payments.filter(p => p.orderId !== id);
    saveDB(); renderOrders(); toast('Order deleted', 'success');
  });
}
function updateOrderStatus(id, status) {
  const o = db.orders.find(x => x.id === id);
  if (o) { o.status = status; saveDB(); toast('Status updated to ' + statusLabel(status), 'info'); }
}
function filterOrders(v) { renderOrders(v); }
function filterOrdersByStatus(v) { renderOrders('', v); }
function filterOrdersByDress(v) { renderOrders('', '', v); }
function openPaymentForOrder(orderId) {
  const o = db.orders.find(x => x.id === orderId);
  if (!o) return;
  populatePaymentCustomers();
  document.getElementById('pay-customer').value = o.customerId;
  loadPaymentOrders();
  setTimeout(() => {
    document.getElementById('pay-order').value = orderId;
    loadOrderBalance();
  }, 50);
  openModal('modal-add-payment');
}

// ============================================================
// PAYMENTS
// ============================================================
function renderPayments(filter = '', methodF = '') {
  let list = db.payments;
  if (filter) list = list.filter(p => {
    const c = db.customers.find(x => x.id === p.customerId);
    return c && c.name.toLowerCase().includes(filter.toLowerCase());
  });
  if (methodF) list = list.filter(p => p.method === methodF);
  const totalRevenue = db.payments.reduce((s, p) => s + p.amount, 0);
  const todayRevenue = db.payments.filter(p => p.date === new Date().toISOString().split('T')[0]).reduce((s, p) => s + p.amount, 0);
  const pendingAmt = db.orders.reduce((s, o) => s + o.remaining, 0);
  document.getElementById('payment-stats').innerHTML = [
    { label: 'Total Revenue', value: '₨ ' + totalRevenue.toLocaleString(), color: 'var(--teal)' },
    { label: "Today's Revenue", value: '₨ ' + todayRevenue.toLocaleString(), color: 'var(--accent)' },
    { label: 'Pending Amount', value: '₨ ' + pendingAmt.toLocaleString(), color: 'var(--rose)' },
    { label: 'Total Payments', value: db.payments.length, color: 'var(--gold)' }
  ].map(s => `<div class="report-stat"><div class="report-stat-value" style="color:${s.color}">${s.value}</div><div class="report-stat-label">${s.label}</div></div>`).join('');
  const tbody = document.getElementById('payments-tbody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">💳</div><div class="empty-title">No payments recorded</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = list.map((p, i) => {
    const c = db.customers.find(x => x.id === p.customerId);
    return `<tr>
      <td class="font-mono text-xs text-muted">REC-${String(i+1).padStart(4,'0')}</td>
      <td><div style="font-weight:600;font-size:.88rem">${c ? c.name : 'Unknown'}</div></td>
      <td class="text-xs text-muted">${p.orderId}</td>
      <td style="font-weight:700;color:var(--teal);font-family:'JetBrains Mono',monospace">₨ ${p.amount.toLocaleString()}</td>
      <td><span class="badge badge-paid">${p.method}</span></td>
      <td class="text-xs text-muted">${p.date}</td>
      <td><div class="td-actions">
        <button class="btn btn-xs btn-danger" onclick="deletePayment('${p.id}')">🗑️</button>
      </div></td>
    </tr>`;
  }).join('');
}
function filterPayments(v) { renderPayments(v); }
function filterPaymentsByMethod(v) { renderPayments('', v); }
function populatePaymentCustomers() {
  const sel = document.getElementById('pay-customer');
  sel.innerHTML = '<option value="">Select customer...</option>' + db.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}
function loadPaymentOrders() {
  const custId = document.getElementById('pay-customer').value;
  const sel = document.getElementById('pay-order');
  const orders = db.orders.filter(o => o.customerId === custId && o.remaining > 0);
  sel.innerHTML = '<option value="">Select order...</option>' + orders.map(o => `<option value="${o.id}">${o.dressType} — ₨${o.price.toLocaleString()}</option>`).join('');
}
function loadOrderBalance() {
  const orderId = document.getElementById('pay-order').value;
  const o = db.orders.find(x => x.id === orderId);
  if (o) {
    document.getElementById('pay-total').value = o.price;
    document.getElementById('pay-balance').value = o.remaining;
    document.getElementById('pay-amount').value = o.remaining;
  }
}
function savePayment() {
  const custId = document.getElementById('pay-customer').value;
  const orderId = document.getElementById('pay-order').value;
  const amount = parseFloat(document.getElementById('pay-amount').value) || 0;
  const date = document.getElementById('pay-date').value || new Date().toISOString().split('T')[0];
  if (!custId || !orderId || !amount) { toast('Please fill required fields', 'error'); return; }
  db.payments.push({ id: 'p' + Date.now(), customerId: custId, orderId, amount, method: document.getElementById('pay-method').value, date, notes: document.getElementById('pay-notes').value, createdAt: new Date().toISOString() });
  const o = db.orders.find(x => x.id === orderId);
  if (o) { o.advance += amount; o.remaining = Math.max(0, o.remaining - amount); }
  saveDB(); closeModal('modal-add-payment'); toast('Payment recorded', 'success'); renderPayments();
}
function deletePayment(id) {
  showConfirm('Delete this payment record?', () => {
    db.payments = db.payments.filter(p => p.id !== id);
    saveDB(); renderPayments(); toast('Payment deleted', 'success');
  });
}

// ============================================================
// REPORTS
// ============================================================
function renderReports() {
  const totalRev = db.payments.reduce((s, p) => s + p.amount, 0);
  const pendingRev = db.orders.reduce((s, o) => s + o.remaining, 0);
  const lateOrders = db.orders.filter(o => new Date(o.deliveryDate) < new Date() && o.status !== 'delivered').length;
  document.getElementById('reports-stats').innerHTML = [
    { label: 'Total Revenue', value: '₨ ' + totalRev.toLocaleString(), color: 'var(--teal)' },
    { label: 'Pending Revenue', value: '₨ ' + pendingRev.toLocaleString(), color: 'var(--rose)' },
    { label: 'Total Customers', value: db.customers.length, color: 'var(--accent)' },
    { label: 'Total Orders', value: db.orders.length, color: 'var(--gold)' },
    { label: 'Late Deliveries', value: lateOrders, color: 'var(--rose)' },
    { label: 'Delivered Orders', value: db.orders.filter(o => o.status === 'delivered').length, color: 'var(--teal)' }
  ].map(s => `<div class="report-stat"><div class="report-stat-value" style="color:${s.color}">${s.value}</div><div class="report-stat-label">${s.label}</div></div>`).join('');

  // Top customers
  const custRevenue = db.customers.map(c => ({
    c, rev: db.payments.filter(p => p.customerId === c.id).reduce((s, p) => s + p.amount, 0)
  })).sort((a, b) => b.rev - a.rev).slice(0, 5);
  document.getElementById('top-customers-list').innerHTML = custRevenue.map((item, i) => `
    <div class="flex items-center gap-3" style="padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="width:24px;height:24px;background:var(--bg2);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:var(--accent)">${i+1}</div>
      <div style="flex:1;font-weight:600;font-size:.88rem">${item.c.name}</div>
      <div class="font-mono text-success text-sm">₨ ${item.rev.toLocaleString()}</div>
    </div>`).join('');

  // Dress types
  const dressCount = {};
  db.orders.forEach(o => dressCount[o.dressType] = (dressCount[o.dressType] || 0) + 1);
  const sorted = Object.entries(dressCount).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] || 1;
  document.getElementById('dress-types-list').innerHTML = sorted.map(([d, count]) => `
    <div style="margin-bottom:12px">
      <div class="flex items-center gap-2 mb-2"><span style="font-size:.88rem;font-weight:600">${d}</span><span class="ml-auto text-xs text-muted">${count} orders</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${(count/max*100).toFixed(0)}%;background:linear-gradient(90deg,var(--accent),var(--accent2))"></div></div>
    </div>`).join('');

  // Chart
  destroyChart('rev-report');
  const months = ['Jan','Feb','Mar','Apr','May','Jun'];
  const now2 = new Date();
  const data = months.map((_, i) => {
    const m = new Date(now2.getFullYear(), now2.getMonth() - 5 + i, 1);
    return db.payments.filter(p => {
      const d = new Date(p.createdAt || p.date);
      return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
    }).reduce((s, p) => s + p.amount, 0);
  });
  const gridColor = currentTheme === 'dark' ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
  const tickColor = currentTheme === 'dark' ? '#6a6a82' : '#8888a8';
  chartInstances['rev-report'] = new Chart(document.getElementById('chart-revenue-report').getContext('2d'), {
    type: 'line', data: {
      labels: months,
      datasets: [{ data, borderColor: '#7c6af7', backgroundColor: '#7c6af722', borderWidth: 2.5, tension: .4, fill: true, pointBackgroundColor: '#7c6af7' }]
    }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: gridColor }, ticks: { color: tickColor } }, y: { grid: { color: gridColor }, ticks: { color: tickColor } } } }
  });
}
function refreshReports() { renderReports(); }

// ============================================================
// INVOICE
// ============================================================
function renderInvoicePage() {
  const sel = document.getElementById('invoice-customer');
  sel.innerHTML = '<option value="">Select customer...</option>' + db.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}
function loadInvoiceOrders() {
  const custId = document.getElementById('invoice-customer').value;
  const sel = document.getElementById('invoice-order');
  const orders = db.orders.filter(o => o.customerId === custId);
  sel.innerHTML = '<option value="">Select order...</option>' + orders.map(o => `<option value="${o.id}">${o.dressType} — ₨${o.price}</option>`).join('');
}
function previewInvoice() {
  const orderId = document.getElementById('invoice-order').value;
  if (!orderId) return;
  const o = db.orders.find(x => x.id === orderId);
  const c = db.customers.find(x => x.id === o.customerId);
  const user = db.users[currentUser?.uid] || {};
  const paid = db.payments.filter(p => p.orderId === orderId).reduce((s, p) => s + p.amount, 0);
  const invNum = 'INV-' + orderId.toUpperCase();
  document.getElementById('invoice-preview-wrap').innerHTML = `
    <div class="invoice-preview" id="invoice-printable">
      <div class="invoice-header">
        <div class="invoice-shop">
          <div style="font-size:2rem;margin-bottom:8px">✂️</div>
          <h2>${user.shopName || 'Tailor Shop'}</h2>
          <p>📍 ${user.address || 'Shop Address'}</p>
          <p>📱 ${user.phone || '03001234567'}</p>
        </div>
        <div class="invoice-meta">
          <h3>INVOICE</h3>
          <p><strong>${invNum}</strong></p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
          <p>Delivery: ${o.deliveryDate}</p>
        </div>
      </div>
      <hr class="invoice-divider"/>
      <div class="invoice-customer">
        <h4>Bill To</h4>
        <p>${c.name}</p>
        <p style="font-size:.82rem;color:#4a4a6a">${c.phone} ${c.city ? '· ' + c.city : ''}</p>
      </div>
      <table class="invoice-table">
        <thead><tr><th>Item</th><th>Details</th><th>Qty</th><th>Amount</th></tr></thead>
        <tbody>
          <tr><td>${o.dressType}</td><td>${o.fabric || ''} ${o.color || ''}</td><td>${o.quantity}</td><td>₨ ${o.price.toLocaleString()}</td></tr>
        </tbody>
      </table>
      <div class="invoice-total">
        <div class="invoice-total-row"><span>Subtotal</span><span>₨ ${o.price.toLocaleString()}</span></div>
        <div class="invoice-total-row"><span>Advance Paid</span><span style="color:#06d6a0">- ₨ ${paid.toLocaleString()}</span></div>
        <hr style="border-top:1px solid #ddd;margin:8px 0"/>
        <div class="invoice-total-row final"><span>Balance Due</span><span>₨ ${o.remaining.toLocaleString()}</span></div>
      </div>
      <div class="invoice-footer">
        <p>Thank you for your business! 🙏</p>
        <p>${user.shopName || 'Tailor Shop'} · ${user.phone || ''}</p>
      </div>
    </div>`;
}
function printInvoice() {
  const el = document.getElementById('invoice-printable');
  if (!el) { toast('Please select an order first', 'error'); return; }
  const win = window.open('', '_blank');
  win.document.write(`<html><head><title>Invoice</title><style>body{font-family:sans-serif;padding:40px}table{width:100%;border-collapse:collapse}th,td{padding:10px;border:1px solid #eee;text-align:left}th{background:#f5f5f5}</style></head><body>${el.outerHTML}</body></html>`);
  win.document.close(); win.print();
}
function shareInvoiceWhatsApp() {
  const orderId = document.getElementById('invoice-order').value;
  const o = db.orders.find(x => x.id === orderId);
  const c = db.customers.find(x => x.id === o?.customerId);
  if (!c) { toast('Select an order first', 'error'); return; }
  const user = db.users[currentUser?.uid] || {};
  const msg = encodeURIComponent(`Assalam o Alaikum ${c.name}!\n\nYour order invoice from ${user.shopName || 'Tailor Shop'}:\n\n🧥 ${o.dressType}\n💰 Total: ₨${o.price}\n✅ Paid: ₨${o.advance}\n⏳ Balance: ₨${o.remaining}\n📅 Delivery: ${o.deliveryDate}\n\nShukria!`);
  window.open(`https://wa.me/92${c.phone.replace(/^0/, '')}?text=${msg}`, '_blank');
}
function downloadInvoicePDF() { toast('PDF download would use a PDF library in production', 'info'); }

// ============================================================
// SETTINGS
// ============================================================
function loadSettings() {
  const user = db.users[currentUser?.uid] || {};
  document.getElementById('set-shop-name').value = user.shopName || '';
  document.getElementById('set-owner-name').value = user.name || '';
  document.getElementById('set-phone').value = user.phone || '';
  document.getElementById('set-address').value = user.address || '';
  document.getElementById('set-email').value = currentUser?.email || '';
  const themeToggle = document.getElementById('toggle-theme');
  if (themeToggle) themeToggle.classList.toggle('on', currentTheme === 'dark');
}
function saveSettings() {
  const uid = currentUser?.uid;
  if (!uid) return;
  if (!db.users[uid]) db.users[uid] = {};
  db.users[uid].shopName = document.getElementById('set-shop-name').value;
  db.users[uid].name     = document.getElementById('set-owner-name').value;
  db.users[uid].phone    = document.getElementById('set-phone').value;
  db.users[uid].address  = document.getElementById('set-address').value;
  document.getElementById('shop-name-display').textContent = db.users[uid].shopName || 'My Shop';

  firestore.collection('users').doc(uid).update({
    shopName: db.users[uid].shopName,
    name:     db.users[uid].name,
    phone:    db.users[uid].phone,
    address:  db.users[uid].address
  });

  saveDB();
  toast('Settings saved', 'success');
}

// ============================================================
// NOTIFICATIONS
// ============================================================
function generateNotifications() {
  const notifs = [];
  db.orders.forEach(o => {
    const c = db.customers.find(x => x.id === o.customerId);
    const name = c ? c.name : 'Unknown';
    const days = Math.ceil((new Date(o.deliveryDate) - new Date()) / 86400000);
    if (days < 0 && o.status !== 'delivered') notifs.push({ icon: '⚠️', text: `Late delivery: ${name}'s ${o.dressType}`, time: `${Math.abs(days)}d overdue`, type: 'danger', unread: true });
    else if (days <= 2 && days >= 0 && o.status !== 'delivered') notifs.push({ icon: '📅', text: `Delivery due: ${name}'s ${o.dressType}`, time: `${days === 0 ? 'Today' : days + 'd'}`, type: 'warning', unread: true });
    if (o.remaining > 0 && o.status === 'delivered') notifs.push({ icon: '💰', text: `Pending payment: ${name} — ₨${o.remaining.toLocaleString()}`, time: 'Overdue', type: 'info', unread: false });
  });
  const list = document.getElementById('notif-list');
  if (!notifs.length) {
    list.innerHTML = '<div class="empty-state" style="padding:30px 20px"><div class="empty-icon" style="font-size:28px">✅</div><div class="empty-title" style="font-size:.88rem">All caught up!</div></div>';
    document.getElementById('notif-dot').style.display = 'none';
  } else {
    document.getElementById('notif-dot').style.display = 'block';
    list.innerHTML = notifs.slice(0, 6).map(n => `
      <div class="notif-item ${n.unread ? 'notif-unread' : ''}">
        <div class="notif-item-icon">${n.icon}</div>
        <div class="notif-item-content"><p>${n.text}</p><time>${n.time}</time></div>
      </div>`).join('');
  }
}
function toggleNotifications() {
  const panel = document.getElementById('notif-panel');
  panel.classList.toggle('open');
}
function markAllRead() {
  document.getElementById('notif-dot').style.display = 'none';
  document.querySelectorAll('.notif-unread').forEach(el => el.classList.remove('notif-unread'));
  closeAllDropdowns();
}

// ============================================================
// THEME & LANGUAGE
// ============================================================
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
  const toggle = document.getElementById('toggle-theme');
  if (toggle) toggle.classList.toggle('on', theme === 'dark');
}
function toggleTheme() {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  if (currentPage === 'dashboard') setTimeout(renderCharts, 100);
  if (currentPage === 'reports') setTimeout(renderReports, 100);
}
function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) el.textContent = translations[lang][key];
  });
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = '🌐 ' + (lang === 'en' ? 'EN' : 'RU');
  const ind = document.getElementById('lang-indicator');
  if (ind) ind.textContent = lang === 'en' ? 'English' : 'Roman Urdu';
}
function toggleLang() { applyLang(currentLang === 'en' ? 'ru' : 'en'); }
function t(key) { return translations[currentLang][key] || translations.en[key] || key; }

// ============================================================
// MODAL & UI HELPERS
// ============================================================
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  // Pre-populate customer selects
  if (id === 'modal-add-order') populateOrderCustomers();
  if (id === 'modal-add-payment') { populatePaymentCustomers(); document.getElementById('pay-date').value = new Date().toISOString().split('T')[0]; }
  if (id === 'modal-add-measurement') populateMeasurementCustomers();
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
  editingId = null;
}
function showConfirm(msg, cb) {
  document.getElementById('confirm-message').textContent = msg;
  confirmCallback = cb;
  document.getElementById('confirm-btn').onclick = () => { closeModal('modal-confirm'); cb(); };
  openModal('modal-confirm');
}
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('mobile-open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}
function closeAllDropdowns() {
  document.getElementById('notif-panel').classList.remove('open');
}
function globalSearch(v) {
  if (!v) return;
  const found = db.customers.find(c => c.name.toLowerCase().includes(v.toLowerCase()) || c.phone.includes(v));
  if (found) { navigateTo('customers'); filterCustomers(v); return; }
  const orderFound = db.orders.find(o => {
    const c = db.customers.find(x => x.id === o.customerId);
    return o.id.includes(v) || o.dressType.toLowerCase().includes(v.toLowerCase()) || (c && c.name.toLowerCase().includes(v.toLowerCase()));
  });
  if (orderFound) { navigateTo('orders'); filterOrders(v); }
}
function clearForm(ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); }

// ============================================================
// TOAST
// ============================================================
function toast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ============================================================
// UTILS
// ============================================================
function statusLabel(s) {
  return { pending: 'Pending', cutting: 'Cutting', stitching: 'Stitching', ready: 'Ready', delivered: 'Delivered' }[s] || s;
}
function formatDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

// ============================================================
// CLOSE PANELS ON OUTSIDE CLICK
// ============================================================
document.addEventListener('click', e => {
  if (!e.target.closest('.notif-btn') && !e.target.closest('.notif-panel')) {
    document.getElementById('notif-panel')?.classList.remove('open');
  }
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
    editingId = null;
  }
});

// ============================================================
// INIT
// ============================================================
(function init() {
  applyTheme(currentTheme);
  applyLang(currentLang);
  const mbn = document.getElementById('mobile-bottom-nav');
  if (mbn) mbn.style.display = 'none';

  // ✅ Pehle loading dikha
  document.getElementById('auth-screen').style.display = 'none';

  auth.onAuthStateChanged(user => {
    if (user) {
      currentUser = { uid: user.uid, email: user.email };
      launchApp();
    } else {
      // ✅ Sirf tab dikha jab confirm ho ke logged out hai
      document.getElementById('auth-screen').style.display = 'flex';
    }
  });
})();