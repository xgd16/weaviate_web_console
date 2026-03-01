<script setup lang="ts">
import { ref } from 'vue'
import { ElCard, ElButton, ElInput, ElMessage, ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getClassification, createClassification } from '@/api/weaviate'
import type { Classification } from '@/types/weaviate'

const queryId = ref('')
const loading = ref(false)
const { t } = useI18n()
const detail = ref<Classification | null>(null)
const createJson = ref('{"class":"","classifyProperties":[],"basedOnProperties":[]}')
const createLoading = ref(false)

async function fetchById() {
  if (!queryId.value.trim()) {
    ElMessage.warning(t('classifications.inputIdRequired'))
    return
  }
  loading.value = true
  detail.value = null
  try {
    detail.value = await getClassification(queryId.value.trim())
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('classifications.fetchFailed'))
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  createLoading.value = true
  try {
    const params = JSON.parse(createJson.value) as Classification
    const res = await createClassification(params)
    ElMessage.success(t('classifications.createSuccess'))
    if (res.id) {
      queryId.value = res.id
      detail.value = res
    }
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('classifications.createFailed'))
  } finally {
    createLoading.value = false
  }
}
</script>

<template>
  <div class="page-content">
    <ElCard shadow="never">
      <template #header>
        <span>{{ t('classifications.queryStatus') }}</span>
      </template>
      <div class="flex-gap" style="margin-bottom: 16px">
        <ElInput v-model="queryId" :placeholder="t('classifications.placeholder')" style="width: 360px" clearable />
        <ElButton type="primary" :loading="loading" @click="fetchById">{{ t('classifications.query') }}</ElButton>
      </div>
      <ElDescriptions v-if="detail" :column="1" border>
        <ElDescriptionsItem label="ID">{{ detail.id }}</ElDescriptionsItem>
        <ElDescriptionsItem label="Collection">{{ detail.class }}</ElDescriptionsItem>
        <ElDescriptionsItem :label="t('overview.status')">
          <ElTag :type="detail.status === 'completed' ? 'success' : 'info'">{{ detail.status }}</ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="t('classifications.basedOnProps')">
          {{ Array.isArray(detail.basedOnProperties) ? detail.basedOnProperties.join(', ') : '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="t('classifications.classifiedProps')">
          {{ Array.isArray(detail.classifiedProperties) ? detail.classifiedProperties.join(', ') : '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElCard>

    <ElCard shadow="never">
      <template #header>
        <span>{{ t('classifications.createTask') }}</span>
      </template>
      <p class="form-hint">{{ t('classifications.createHint') }}</p>
      <ElInput v-model="createJson" type="textarea" :rows="8" style="font-family: monospace" />
      <ElButton type="primary" :loading="createLoading" style="margin-top: 12px" @click="handleCreate">
        {{ t('classifications.createClassification') }}
      </ElButton>
    </ElCard>
  </div>
</template>

<style scoped>
.form-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}
</style>
