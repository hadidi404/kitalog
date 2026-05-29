import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import NewJob from '../views/NewJob.vue'
import EditJob from '../views/EditJob.vue'
import Jobs from '../views/Jobs.vue'
import Customers from '../views/Customers.vue'
import Analytics from '../views/Analytics.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: Dashboard, meta: { title: 'Dashboard' } },
    { path: '/jobs/new', component: NewJob, meta: { title: 'New Repair Job' } },
    { path: '/jobs/:id/edit', component: EditJob, meta: { title: 'Edit Job' } },
    { path: '/jobs', component: Jobs, meta: { title: 'All Jobs' } },
    { path: '/customers', component: Customers, meta: { title: 'Customers' } },
    { path: '/analytics', component: Analytics, meta: { title: 'Analytics' } }
  ]
})
