<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElTag,
  ElAlert,
  ElSkeleton,
  ElButton,
  ElLink,
  ElTable,
  ElTableColumn,
  ElCollapse,
  ElCollapseItem,
} from 'element-plus'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { checkLiveness, checkReadiness, getMeta, getNodes, checkLivenessWithTiming } from '@/api/weaviate'
import type { WeaviateMeta, WeaviateNode } from '@/types/weaviate'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

const { t } = useI18n()
const loading = ref(true)
const meta = ref<WeaviateMeta | null>(null)
const nodes = ref<WeaviateNode[]>([])
const live = ref<boolean | null>(null)
const ready = ref<boolean | null>(null)
const error = ref<string | null>(null)
const settingsStore = useSettingsStore()

/** 服务状态曲线图数据：最近 60 个采样点，每 10 秒一次 */
const statusHistory = ref<{ time: string; ms: number; ok: boolean }[]>([])
const MAX_POINTS = 60
const POLL_INTERVAL = 10_000 // 10 秒
let pollTimer: ReturnType<typeof setInterval> | null = null

function formatTime(d: Date) {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

async function pollStatus() {
  try {
    const { ok, ms } = await checkLivenessWithTiming()
    const now = new Date()
    const point = { time: formatTime(now), ms, ok }
    statusHistory.value = [...statusHistory.value.slice(-(MAX_POINTS - 1)), point]
  } catch {
    const now = new Date()
    statusHistory.value = [...statusHistory.value.slice(-(MAX_POINTS - 1)), { time: formatTime(now), ms: 0, ok: false }]
  }
}

const chartOption = computed(() => {
  const data = statusHistory.value
  if (data.length === 0) {
    return {
      title: { text: t('overview.chartNoData'), left: 'center', top: 'middle', textStyle: { fontSize: 14, color: 'var(--el-text-color-secondary)' } },
    }
  }
  const times = data.map((d) => d.time)
  const responseMs = data.map((d) => (d.ok ? d.ms : 0))
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const p = Array.isArray(params) ? params[0] : null
        if (!p || p.data == null) return ''
        const i = p.dataIndex as number
        const d = data[i]
        if (!d) return ''
        return `${d.time}<br/>${t('overview.chartResponse')}: ${d.ok ? d.ms + ' ms' : t('overview.chartFailed')}`
      },
    },
    grid: { left: 48, right: 24, top: 16, bottom: 32 },
    xAxis: {
      type: 'category',
      data: times,
      axisLabel: { fontSize: 10, color: 'var(--el-text-color-secondary)' },
    },
    yAxis: {
      type: 'value',
      name: 'ms',
      axisLabel: { fontSize: 10, color: 'var(--el-text-color-secondary)' },
      splitLine: { lineStyle: { color: 'var(--el-border-color-lighter)' } },
    },
    series: [
      {
        name: t('overview.responseTime'),
        type: 'line',
        data: responseMs,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: 'var(--el-color-primary)' },
        itemStyle: {
          color: (params: { dataIndex: number }) =>
            data[params.dataIndex]?.ok ? 'var(--el-color-primary)' : 'var(--el-color-danger)',
        },
      },
    ],
  }
})

async function fetchStatus() {
  loading.value = true
  error.value = null
  try {
    const [liveRes, readyRes, metaRes, nodesRes] = await Promise.all([
      checkLiveness(),
      checkReadiness(),
      getMeta().catch(() => null),
      getNodes().catch(() => ({ nodes: [] })),
    ])
    live.value = liveRes
    ready.value = readyRes
    meta.value = metaRes
    nodes.value = nodesRes?.nodes ?? []
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('overview.connectError', { url: settingsStore.apiBaseUrlWithV1 })
  } finally {
    loading.value = false
  }
}

const modulesList = computed(() => {
  const m = meta.value?.modules
  if (!m || typeof m !== 'object') return []
  return Object.entries(m).map(([key, val]) => ({
    name: key,
    label: (val as { name?: string })?.name ?? key,
    href: (val as { documentationHref?: string })?.documentationHref,
  }))
})

function startPolling() {
  if (pollTimer) return
  pollStatus()
  pollTimer = setInterval(pollStatus, POLL_INTERVAL)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

onMounted(() => {
  fetchStatus()
  startPolling()
})

onUnmounted(stopPolling)
</script>

<template>
  <div class="page-content">
    <ElAlert
      v-if="error"
      type="error"
      :title="error"
      show-icon
    />

    <div class="page-grid">
      <ElCard shadow="never">
        <template #header>
          <span>{{ t('overview.serviceStatus') }}</span>
        </template>
        <ElSkeleton v-if="loading" :rows="4" animated />
        <div v-else>
          <div class="flex-between" style="margin-bottom: 16px">
            <span>{{ t('overview.liveness') }}</span>
            <ElTag :type="live ? 'success' : 'danger'" size="large">
              {{ live ? t('overview.normal') : t('overview.abnormal') }}
            </ElTag>
          </div>
          <div class="flex-between" style="margin-bottom: 16px">
            <span>{{ t('overview.readiness') }}</span>
            <ElTag :type="ready ? 'success' : 'danger'" size="large">
              {{ ready ? t('overview.ready') : t('overview.notReady') }}
            </ElTag>
          </div>
          <div class="status-chart-wrap">
            <div class="chart-title">{{ t('overview.statusChartTitle') }}</div>
            <VChart :option="chartOption" class="status-chart" autoresize />
          </div>
          <div style="padding-top: 16px">
            <ElButton type="primary" @click="fetchStatus">
              {{ t('overview.refreshStatus') }}
            </ElButton>
          </div>
        </div>
      </ElCard>

      <ElCard shadow="never">
        <template #header>
          <span>{{ t('overview.instanceInfo') }}</span>
        </template>
        <ElSkeleton v-if="loading" :rows="5" animated />
        <ElDescriptions v-else :column="1" border>
          <ElDescriptionsItem :label="t('overview.version')">
            {{ meta?.version ?? '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('overview.hostname')">
            {{ meta?.hostname ?? '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('overview.apiAddress')">
            <ElLink
              :href="settingsStore.apiDocsUrl"
              target="_blank"
              type="primary"
            >
              {{ settingsStore.apiDocsUrl }}
            </ElLink>
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>
    </div>

    <ElCard v-if="!loading && nodes.length > 0" shadow="never">
      <template #header>
        <span>{{ t('overview.nodeStatus') }} ({{ nodes.length }})</span>
      </template>
      <ElTable :data="nodes" stripe>
        <ElTableColumn prop="name" :label="t('overview.nodeName')" min-width="180" />
        <ElTableColumn prop="version" :label="t('overview.version')" width="100" />
        <ElTableColumn prop="status" :label="t('overview.status')" width="100">
          <template #default="{ row }">
            <ElTag :type="row.status === 'HEALTHY' ? 'success' : 'danger'" size="small">
              {{ row.status ?? '-' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="operationalMode" :label="t('overview.mode')" width="120" />
        <ElTableColumn :label="t('overview.batchQueue')">
          <template #default="{ row }">
            {{ row.batchStats?.queueLength ?? '-' }} / {{ row.batchStats?.ratePerSecond ?? '-' }}/s
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElCard v-if="!loading && modulesList.length > 0" shadow="never">
      <template #header>
        <span>{{ t('overview.loadedModules') }} ({{ modulesList.length }})</span>
      </template>
      <ElCollapse>
        <ElCollapseItem :title="t('overview.viewModuleList')" name="modules">
          <div class="modules-grid">
            <ElTag
              v-for="mod in modulesList"
              :key="mod.name"
              type="info"
              class="module-tag"
            >
              <a
                v-if="mod.href"
                :href="mod.href"
                target="_blank"
                rel="noopener noreferrer"
                class="module-link"
              >
                {{ mod.label }}
              </a>
              <span v-else>{{ mod.label }}</span>
            </ElTag>
          </div>
        </ElCollapseItem>
      </ElCollapse>
    </ElCard>

    <ElCard shadow="never">
      <template #header>
        <span>{{ t('overview.quickLinks') }}</span>
      </template>
      <div class="flex-wrap-gap">
        <RouterLink
          v-for="item in [{ to: '/schema', labelKey: 'nav.schema' }, { to: '/objects', labelKey: 'nav.objects' }, { to: '/graphql', labelKey: 'nav.graphql' }, { to: '/classifications', labelKey: 'nav.classifications' }]"
          :key="item.to"
          :to="item.to"
          class="quick-link"
        >
          {{ t(item.labelKey) }}
        </RouterLink>
      </div>
    </ElCard>
  </div>
</template>

<style scoped>
.status-chart-wrap {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.chart-title {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.status-chart {
  height: 200px;
  width: 100%;
}

.modules-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.module-tag {
  margin: 0;
}

.module-link {
  color: inherit;
  text-decoration: none;
}

.module-link:hover {
  text-decoration: underline;
}
</style>
