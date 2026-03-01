import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/** Docker 构建时传 VITE_DEFAULT_API_BASE="" 使用同源代理，避免 CORS */
const DEFAULT_API_BASE =
  import.meta.env.VITE_DEFAULT_API_BASE !== undefined
    ? import.meta.env.VITE_DEFAULT_API_BASE
    : 'http://127.0.0.1:8182'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const apiBaseUrl = ref(DEFAULT_API_BASE)

    const apiBaseUrlWithV1 = computed(() => {
      const url = apiBaseUrl.value.trim().replace(/\/+$/, '')
      if (url) return `${url}/v1`
      return DEFAULT_API_BASE ? `${DEFAULT_API_BASE}/v1` : '/v1'
    })

    /** API 请求用：开发模式或同源代理时走相对路径 /v1 */
    const apiRequestBase = computed(() => {
      const full = apiBaseUrlWithV1.value
      if (full === '/v1') return '/v1'
      if (import.meta.env.DEV && full === `${DEFAULT_API_BASE}/v1`) return '/v1'
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
