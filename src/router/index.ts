import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/layouts/Layout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/overview',
    children: [
      { path: 'overview', name: 'Overview', component: () => import('@/views/Overview.vue'), meta: { titleKey: 'nav.overview' } },
      { path: 'schema', name: 'Schema', component: () => import('@/views/Schema.vue'), meta: { titleKey: 'nav.schema' } },
      { path: 'objects', name: 'Objects', component: () => import('@/views/Objects.vue'), meta: { titleKey: 'nav.objects' } },
      { path: 'graphql', name: 'GraphQL', component: () => import('@/views/GraphQL.vue'), meta: { titleKey: 'nav.graphql' } },
      { path: 'classifications', name: 'Classifications', component: () => import('@/views/Classifications.vue'), meta: { titleKey: 'nav.classifications' } },
    ],
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
