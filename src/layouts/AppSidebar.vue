<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import {
  Odometer,
  Collection,
  Document,
  Promotion,
  Rank,
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'

const route = useRoute()
const { t } = useI18n()
const settingsStore = useSettingsStore()

const menuItems = [
  { path: '/overview', nameKey: 'nav.overview', icon: Odometer },
  { path: '/schema', nameKey: 'nav.schema', icon: Collection },
  { path: '/objects', nameKey: 'nav.objects', icon: Document },
  { path: '/graphql', nameKey: 'nav.graphql', icon: Promotion },
  { path: '/classifications', nameKey: 'nav.classifications', icon: Rank },
]
</script>

<template>
  <div class="sidebar-inner">
    <div class="sidebar-logo">
      <RouterLink to="/" class="sidebar-link">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <span class="logo-text">Weaviate</span>
      </RouterLink>
    </div>
    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="sidebar-link"
        :class="{ 'router-link-active': route.path === item.path }"
      >
        <component :is="item.icon" class="sidebar-icon" />
        {{ t(item.nameKey) }}
      </RouterLink>
    </nav>
    <div class="sidebar-footer">
      <a
        :href="settingsStore.apiDocsUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="api-doc-link"
      >
        {{ t('nav.apiDocsLink') }}
      </a>
    </div>
  </div>
</template>

<style scoped>
.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 16px 0;
  box-sizing: border-box;
}

.sidebar-logo {
  margin-bottom: 24px;
  padding: 0 16px;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

html.dark .logo-icon {
  background-color: var(--el-color-primary-dark-2);
  color: var(--el-color-primary-light-3);
}

.logo-icon svg {
  width: 20px;
  height: 20px;
}

.logo-text {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.sidebar-nav {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 12px;
  overflow-y: auto;
}

.sidebar-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sidebar-footer {
  margin-top: auto;
  padding: 16px 16px 0;
  border-top: 1px solid var(--el-border-color);
}

.api-doc-link {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-decoration: none;
}

.api-doc-link:hover {
  color: var(--el-color-primary);
}
</style>
