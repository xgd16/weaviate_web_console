import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const DEFAULT_API_BASE = 'http://127.0.0.1:8182'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const apiBaseUrl = ref(DEFAULT_API_BASE)

    const apiBaseUrlWithV1 = computed(() => {
      const url = apiBaseUrl.value.trim().replace(/\/+$/, '')
      return url ? `${url}/v1` : `${DEFAULT_API_BASE}/v1`
    })

    /** API 请求用：开发模式 + 默认地址时走 Vite 代理 */
    const apiRequestBase = computed(() => {
      const full = apiBaseUrlWithV1.value
      if (import.meta.env.DEV && full === `${DEFAULT_API_BASE}/v1`) {
        return '/v1'
      }
      return full
    })

    const apiDocsUrl = computed(() => `${apiBaseUrlWithV1.value}/docs`)

    function setApiBaseUrl(url: string) {
      apiBaseUrl.value = url.trim().replace(/\/+$/, '') || DEFAULT_API_BASE
    }

    function resetApiBaseUrl() {
      apiBaseUrl.value = DEFAULT_API_BASE
    }

    return {
      apiBaseUrl,
      apiBaseUrlWithV1,
      apiRequestBase,
      apiDocsUrl,
      setApiBaseUrl,
      resetApiBaseUrl,
    }
  },
  {
    persist: {
      key: 'weaviate-settings',
      storage: localStorage,
      pick: ['apiBaseUrl'],
    },
  }
)
