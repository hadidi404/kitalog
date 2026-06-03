import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Dashboard from '../views/Dashboard.vue'
import Login from '../views/Login.vue'
import NewJob from '../views/NewJob.vue'
import EditJob from '../views/EditJob.vue'
import Jobs from '../views/Jobs.vue'
import Customers from '../views/Customers.vue'
import Analytics from '../views/Analytics.vue'

const ComingSoon = {
  template: `
    <div class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <svg class="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
      </div>
      <p class="text-base font-semibold text-slate-700">Coming Soon</p>
      <p class="text-sm text-slate-400 mt-1">This feature is under development.</p>
    </div>
  `,
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',              redirect: '/dashboard' },
    { path: '/login',         component: Login,       meta: { public: true           } },
    { path: '/dashboard',     component: Dashboard,   meta: { title: 'Dashboard'     } },
    { path: '/jobs/new',      component: NewJob,      meta: { title: 'New Job'       } },
    { path: '/jobs/:id/edit', component: EditJob,     meta: { title: 'Edit Job'      } },
    { path: '/jobs',          component: Jobs,        meta: { title: 'All Jobs'      } },
    { path: '/customers',     component: Customers,   meta: { title: 'Customers'     } },
    { path: '/analytics',     component: Analytics,   meta: { title: 'Analytics'     } },
    { path: '/parts',         component: ComingSoon,  meta: { title: 'Parts'         } },
    { path: '/expenses',      component: ComingSoon,  meta: { title: 'Expenses'      } },
    { path: '/reports',       component: ComingSoon,  meta: { title: 'Reports'       } },
    { path: '/settings',      component: ComingSoon,  meta: { title: 'Settings'      } },
  ],
})

router.beforeEach(async to => {
  const auth = useAuthStore()
  await auth.ready

  if (!to.meta.public && !auth.user) return '/login'
  if (to.path === '/login' && auth.user) return '/dashboard'
})

export default router
