<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  ElCard,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
  ElButton,
  ElDialog,
  ElMessage,
  ElMessageBox,
  ElPagination,
  ElEmpty,
  ElAlert,
  ElSwitch,
  ElCollapse,
  ElCollapseItem,
} from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { getSchema, listObjects, getObject, deleteObject, batchDeleteObjects, createObject, batchCreateObjects } from '@/api/weaviate'
import CodeEditor from '@/components/CodeEditor.vue'
import type { WeaviateClass, WeaviateObject } from '@/types/weaviate'

const loading = ref(true)
const classesLoading = ref(true)
const classesError = ref<string | null>(null)
const classes = ref<WeaviateClass[]>([])
const route = useRoute()
const selectedClass = ref('')
const objects = ref<WeaviateObject[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const detailDialogVisible = ref(false)
const selectedObject = ref<WeaviateObject | null>(null)
const createDialogVisible = ref(false)
const createObjectJson = ref('')
const createLoading = ref(false)
const batchDialogVisible = ref(false)
const batchObjectsJson = ref('')
const batchLoading = ref(false)
const selectedRows = ref<WeaviateObject[]>([])
const batchDeleteLoading = ref(false)
const includeVector = ref(false)

const { t } = useI18n()
const hasClass = computed(() => selectedClass.value.length > 0)
const hasSelection = computed(() => selectedRows.value.length > 0)

async function fetchClasses() {
  classesLoading.value = true
  classesError.value = null
  try {
    const schema = await getSchema()
    classes.value = schema.classes ?? []
    const q = route.query.class
    const fromQuery = Array.isArray(q) ? q[0] : q
    const targetClass = fromQuery && classes.value.some(c => c.class === fromQuery)
      ? fromQuery
      : classes.value[0]?.class
    if (targetClass) {
      selectedClass.value = targetClass
    }
  } catch (e) {
    classesError.value = e instanceof Error ? e.message : t('objects.fetchFailed')
    classes.value = []
    ElMessage.error(classesError.value)
  } finally {
    classesLoading.value = false
  }
}

async function fetchObjects() {
  if (!selectedClass.value) return
  loading.value = true
  try {
    const res = await listObjects({
      class: selectedClass.value,
      limit: pageSize.value,
      offset: (page.value - 1) * pageSize.value,
      include: includeVector.value ? 'vector' : undefined,
    })
    objects.value = res.objects ?? []
    total.value = res.totalResults ?? (res.objects?.length ?? 0)
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('objects.objectsFetchFailed'))
    objects.value = []
  } finally {
    loading.value = false
  }
}

const detailLoading = ref(false)
async function showDetail(obj: WeaviateObject) {
  selectedObject.value = obj
  detailDialogVisible.value = true
  if (!obj.vector && obj.id) {
    detailLoading.value = true
    try {
      const full = await getObject(obj.id, selectedClass.value, { include: 'vector' })
      selectedObject.value = full
    } catch {
      // 忽略，使用已有数据
    } finally {
      detailLoading.value = false
    }
  }
}

function formatJsonCreate() {
  try {
    createObjectJson.value = JSON.stringify(JSON.parse(createObjectJson.value), null, 2)
    ElMessage.success(t('objects.formatSuccess'))
  } catch {
    ElMessage.error(t('objects.jsonError'))
  }
}

function formatJsonBatch() {
  try {
    batchObjectsJson.value = JSON.stringify(JSON.parse(batchObjectsJson.value), null, 2)
    ElMessage.success(t('objects.formatSuccess'))
  } catch {
    ElMessage.error(t('objects.jsonError'))
  }
}

function openCreate() {
  createObjectJson.value = JSON.stringify({
    class: selectedClass.value,
    properties: {},
  }, null, 2)
  createDialogVisible.value = true
}

async function handleCreate() {
  if (!selectedClass.value) return
  createLoading.value = true
  try {
    const obj = JSON.parse(createObjectJson.value) as WeaviateObject
    obj.class = selectedClass.value
    await createObject(obj)
    ElMessage.success(t('objects.createSuccess'))
    createDialogVisible.value = false
    await fetchObjects()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('objects.createFailed'))
  } finally {
    createLoading.value = false
  }
}

function openBatch() {
  batchObjectsJson.value = JSON.stringify([{
    class: selectedClass.value,
    properties: {},
  }], null, 2)
  batchDialogVisible.value = true
}

async function handleBatch() {
  if (!selectedClass.value) return
  batchLoading.value = true
  try {
    const arr = JSON.parse(batchObjectsJson.value)
    const objects = Array.isArray(arr) ? arr : [arr]
    const batch = { objects: objects.map((o: WeaviateObject) => ({ ...o, class: o.class || selectedClass.value })) }
    const res = await batchCreateObjects(batch)
    const failed = res.filter((r: { result?: { errors?: unknown } }) => r.result?.errors)?.length ?? 0
    const ok = res.length - failed
    ElMessage.success(`完成：成功 ${ok} 个${failed ? `，失败 ${failed} 个` : ''}`)
    batchDialogVisible.value = false
    await fetchObjects()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('objects.batchFailed'))
  } finally {
    batchLoading.value = false
  }
}

async function handleDelete(obj: WeaviateObject) {
  if (!obj.id) return
  try {
    await ElMessageBox.confirm(t('objects.deleteConfirm'), t('schema.warning'), {
      type: 'warning',
    })
    await deleteObject(obj.id, selectedClass.value)
    ElMessage.success(t('objects.deleteSuccess'))
    await fetchObjects()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e instanceof Error ? e.message : t('objects.deleteFailed'))
    }
  }
}

async function handleBatchDelete() {
  const ids = selectedRows.value.map((o) => o.id).filter((id): id is string => !!id)
  if (ids.length === 0) return
  try {
    await ElMessageBox.confirm(
      t('objects.batchDeleteConfirm', { count: ids.length }),
      t('objects.batchDelete'),
      { type: 'warning', confirmButtonText: t('common.delete') }
    )
    batchDeleteLoading.value = true
    const { ok, failed } = await batchDeleteObjects(ids, selectedClass.value)
    ElMessage.success(`完成：成功 ${ok} 个${failed ? `，失败 ${failed} 个` : ''}`)
    selectedRows.value = []
    await fetchObjects()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e instanceof Error ? e.message : t('objects.batchDeleteFailed'))
    }
  } finally {
    batchDeleteLoading.value = false
  }
}

watch(selectedClass, () => {
  page.value = 1
  fetchObjects()
})
watch([page, pageSize], fetchObjects)
watch(
  () => route.query.class,
  (classFromQuery) => {
    const name = Array.isArray(classFromQuery) ? classFromQuery[0] : classFromQuery
    if (name && classes.value.some(c => c.class === name)) {
      selectedClass.value = name
    }
  }
)

onMounted(async () => {
  await fetchClasses()
  loading.value = false
  if (selectedClass.value) {
    await fetchObjects()
  }
})
</script>

<template>
  <div class="page-content">
    <ElAlert
      v-if="classesError"
      type="error"
      :title="classesError"
      show-icon
      closable
      class="mb-4"
    >
      {{ t('objects.apiErrorHelp') }}
      <RouterLink to="/overview" class="el-link el-link--primary">{{ t('overview.goOverview') }}</RouterLink>
      {{ t('objects.apiErrorHelp2') }}
      <ElButton type="primary" link size="small" @click="fetchClasses">{{ t('overview.retry') }}</ElButton>
    </ElAlert>
    <ElCard v-loading="classesLoading" shadow="never">
      <div class="flex-gap" style="margin-bottom: 16px">
        <span>{{ t('objects.collection') }}</span>
        <ElSelect
          v-model="selectedClass"
          :placeholder="t('objects.selectCollection')"
          style="width: 256px"
          @change="fetchObjects"
        >
          <ElOption
            v-for="cls in classes"
            :key="cls.class"
            :label="cls.class"
            :value="cls.class"
          />
        </ElSelect>
        <ElButton :disabled="!hasClass" @click="fetchObjects">{{ t('common.refresh') }}</ElButton>
        <span v-if="hasClass" class="vector-toggle">
          <ElSwitch v-model="includeVector" @change="fetchObjects" />
          <span class="vector-toggle-label">{{ t('objects.loadEmbedding') }}</span>
        </span>
        <ElButton v-if="hasClass" type="primary" @click="openCreate">{{ t('objects.newObject') }}</ElButton>
        <ElButton v-if="hasClass" type="success" @click="openBatch">{{ t('objects.batchImport') }}</ElButton>
        <ElButton
          v-if="hasClass && hasSelection"
          type="danger"
          :loading="batchDeleteLoading"
          @click="handleBatchDelete"
        >
          {{ t('objects.batchDelete') }} ({{ selectedRows.length }})
        </ElButton>
      </div>

      <ElTable
        v-loading="loading"
        :data="objects"
        :row-key="(row: WeaviateObject) => row.id ?? ''"
        stripe
        @selection-change="(rows: WeaviateObject[]) => selectedRows = rows"
      >
        <ElTableColumn type="selection" width="48" />
        <ElTableColumn prop="id" label="ID" width="320" show-overflow-tooltip />
        <ElTableColumn v-if="includeVector" label="Embedding" width="100">
          <template #default="{ row }">
            <span v-if="row.vector?.length" class="embedding-badge">{{ row.vector.length }} 维</span>
            <span v-else class="embedding-badge-empty">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('objects.attributes')">
          <template #default="{ row }">
            <pre class="object-preview">{{ JSON.stringify(row.properties ?? {}) }}</pre>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="showDetail(row)">
              {{ t('objects.detail') }}
            </ElButton>
            <ElButton type="danger" link size="small" @click="handleDelete(row)">
              {{ t('common.delete') }}
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div v-if="hasClass" style="margin-top: 16px; display: flex; justify-content: flex-end">
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
        />
      </div>

      <ElEmpty
        v-if="!classesLoading && !classesError && !loading && hasClass && objects.length === 0"
        :description="t('objects.noObjects')"
      />
      <ElEmpty
        v-else-if="!classesLoading && !classesError && !hasClass && classes.length === 0"
        :description="t('objects.noCollection')"
      >
        <RouterLink to="/schema">
          <ElButton type="primary">{{ t('objects.goCreate') }}</ElButton>
        </RouterLink>
      </ElEmpty>
    </ElCard>

    <ElDialog v-model="detailDialogVisible" :title="t('objects.objectDetail')" width="720px">
      <div v-if="selectedObject" v-loading="detailLoading">
        <ElCollapse>
          <ElCollapseItem name="json" :title="t('objects.fullJson')">
            <CodeEditor
              :model-value="JSON.stringify(selectedObject, null, 2)"
              language="json"
              min-height="280px"
              :readonly="true"
            />
          </ElCollapseItem>
          <ElCollapseItem name="embedding" :title="t('objects.embeddingVector')">
            <div v-if="selectedObject.vector && selectedObject.vector.length" class="embedding-section">
              <p class="embedding-meta">{{ t('objects.dimension') }}：{{ selectedObject.vector.length }}</p>
              <CodeEditor
                :model-value="JSON.stringify(selectedObject.vector)"
                language="json"
                min-height="200px"
                :readonly="true"
              />
            </div>
            <div v-else class="embedding-empty">
              <p>{{ t('objects.noVector') }}</p>
              <p class="embedding-hint">{{ t('objects.embeddingHint') }}</p>
            </div>
          </ElCollapseItem>
        </ElCollapse>
      </div>
    </ElDialog>

    <ElDialog v-model="createDialogVisible" :title="t('objects.createTitle')" width="600px">
      <div class="dialog-toolbar">
        <ElButton :icon="MagicStick" size="small" @click="formatJsonCreate">格式化</ElButton>
      </div>
      <CodeEditor v-model="createObjectJson" language="json" min-height="320px" placeholder='{"class":"...","properties":{}}' />
      <template #footer>
        <ElButton @click="createDialogVisible = false">{{ t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="createLoading" @click="handleCreate">{{ t('common.create') }}</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="batchDialogVisible" :title="t('objects.batchTitle')" width="600px">
      <p class="form-hint">{{ t('objects.batchHint') }}</p>
      <div class="dialog-toolbar">
        <ElButton :icon="MagicStick" size="small" @click="formatJsonBatch">格式化</ElButton>
      </div>
      <CodeEditor v-model="batchObjectsJson" language="json" min-height="360px" placeholder='[{"class":"...","properties":{}}]' />
      <template #footer>
        <ElButton @click="batchDialogVisible = false">{{ t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="batchLoading" @click="handleBatch">{{ t('objects.batchImport') }}</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.form-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.dialog-toolbar {
  margin-bottom: 8px;
}

.object-preview {
  max-width: 400px;
  max-height: 60px;
  margin: 0;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.vector-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.vector-toggle-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.embedding-section {
  padding: 8px 0;
}

.embedding-meta {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.embedding-empty {
  padding: 24px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.embedding-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.embedding-badge {
  font-size: 12px;
  color: var(--el-color-primary);
}

.embedding-badge-empty {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
