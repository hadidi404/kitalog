import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Dashboard from '../views/Dashboard.vue'
import Login from '../views/Login.vue'
import NewJob from '../views/NewJob.vue'
import EditJob from '../views/EditJob.vue'
import Jobs from '../views/Jobs.vue'
import Customers from '../views/Customers.vue'
import Inventory from '../views/Inventory.vue'
import Analytics from '../views/Analytics.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',              redirect: '/dashboard' },
    { path: '/login',         component: Login,     meta: { public: true       } },
    { path: '/dashboard',     component: Dashboard, meta: { title: 'Dashboard' } },
    { path: '/jobs/new',      component: NewJob,    meta: { title: 'New Job'   } },
    { path: '/jobs/:id/edit', component: EditJob,   meta: { title: 'Edit Job'  } },
    { path: '/jobs',          component: Jobs,      meta: { title: 'All Jobs'  } },
    { path: '/customers',     component: Customers, meta: { title: 'Customers' } },
    { path: '/inventory',     component: Inventory, meta: { title: 'Inventory' } },
    { path: '/analytics',     component: Analytics, meta: { title: 'Analytics' } },
  ],
})

router.beforeEach(async to => {
  const auth = useAuthStore()
  await auth.ready

  if (!to.meta.public && !auth.user) return '/login'
  if (to.path === '/login' && auth.user) return '/dashboard'
})

export default router
