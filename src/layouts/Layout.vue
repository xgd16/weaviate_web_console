<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElConfigProvider, ElContainer, ElAside, ElMain, ElHeader, ElButton, ElTooltip, ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus'
import { Sunny, Moon, Setting } from '@element-plus/icons-vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import zhTw from 'element-plus/dist/locale/zh-tw.mjs'
import en from 'element-plus/dist/locale/en.mjs'
import ja from 'element-plus/dist/locale/ja.mjs'
import ko from 'element-plus/dist/locale/ko.mjs'
import es from 'element-plus/dist/locale/es.mjs'
import ru from 'element-plus/dist/locale/ru.mjs'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDarkMode } from '@/composables/useDarkMode'
import { i18n, setLocale, supportedLocales, type LocaleType } from '@/i18n'
import AppSidebar from './AppSidebar.vue'
import ApiSettingsDialog from '@/components/ApiSettingsDialog.vue'

const route = useRoute()
const { t } = useI18n()
const { isDark, toggle } = useDarkMode()
const settingsVisible = ref(false)

const elLocaleMap: Record<string, typeof zhCn> = {
  'zh-CN': zhCn,
  'zh-TW': zhTw,
  en,
  ja,
  ko,
  es,
  ru,
}

const pageTitle = computed(() => {
  const key = (route.meta?.titleKey as string) || 'layout.console'
  return t(key)
})

const elementLocale = computed(() => {
  const loc = i18n.global.locale.value as LocaleType
  return elLocaleMap[loc] ?? zhCn
})

function handleLocaleChange(locale: LocaleType) {
  setLocale(locale)
}
</script>

<template>
  <ElConfigProvider :locale="elementLocale">
    <ElContainer class="app-layout">
      <ElAside width="224px" class="app-aside">
        <AppSidebar />
      </ElAside>
      <ElContainer direction="vertical">
        <ElHeader class="app-header">
          <h1 class="app-title">
            {{ pageTitle }}
          </h1>
          <div class="header-actions">
            <ElDropdown trigger="click" @command="handleLocaleChange">
              <ElButton size="small">
                {{ supportedLocales.find(l => l.value === i18n.global.locale.value)?.label ?? '中文' }}
              </ElButton>
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem
                    v-for="loc in supportedLocales"
                    :key="loc.value"
                    :command="loc.value"
                  >
                    {{ loc.label }}
                  </ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
            <ElTooltip :content="t('layout.apiSettings')" placement="bottom">
              <ElButton
                :icon="Setting"
                circle
                @click="settingsVisible = true"
              />
            </ElTooltip>
            <ElTooltip :content="isDark ? t('layout.switchToLight') : t('layout.switchToDark')" placement="bottom">
              <ElButton
                :icon="isDark ? Sunny : Moon"
                circle
                @click="toggle()"
              />
            </ElTooltip>
          </div>
        </ElHeader>
        <ElMain class="app-main">
          <RouterView v-slot="{ Component }">
            <Transition name="fade" mode="out-in">
              <component :is="Component" />
            </Transition>
          </RouterView>
        </ElMain>
      </ElContainer>
    </ElContainer>
    <ApiSettingsDialog v-model="settingsVisible" />
  </ElConfigProvider>
</template>

<style scoped>
.app-layout {
  height: 100vh;
  overflow: hidden;
  display: flex;
}

.app-aside {
  height: 100vh;
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.app-layout :deep(.el-container.is-vertical) {
  flex: 1;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

.app-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.app-main {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
  background-color: var(--el-bg-color-page);
}
</style>
