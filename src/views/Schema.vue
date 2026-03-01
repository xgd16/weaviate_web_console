<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElCard,
  ElTable,
  ElTableColumn,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElTag,
  ElEmpty,
} from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getSchema, getClass, createClass, deleteClass, addProperty, getShards } from '@/api/weaviate'
import type { WeaviateClass, WeaviateProperty, WeaviateSchema } from '@/types/weaviate'
import type { ShardStatus } from '@/types/weaviate'
import { View, List, Plus, Connection } from '@element-plus/icons-vue'

const router = useRouter()
const { t } = useI18n()
const loading = ref(true)
const schema = ref<WeaviateSchema | null>(null)
const dialogVisible = ref(false)
const formLoading = ref(false)
const newClass = ref({ class: '', description: '' })
const propertiesDialogVisible = ref(false)
const selectedClassForProps = ref<WeaviateClass | null>(null)
const propertyConfigDialogVisible = ref(false)
const propertyConfigJson = ref('')
const addPropertyDialogVisible = ref(false)
const addPropertyForm = ref({ name: '', dataType: 'string', description: '', tokenization: '' })
const addPropertyLoading = ref(false)
const shardsDialogVisible = ref(false)
const shardsLoading = ref(false)
const shards = ref<ShardStatus[]>([])

async function fetchSchema() {
  loading.value = true
  try {
    schema.value = await getSchema()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('schema.fetchFailed'))
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!newClass.value.class.trim()) {
    ElMessage.warning(t('schema.inputCollectionName'))
    return
  }
  formLoading.value = true
  try {
    await createClass({
      class: newClass.value.class.trim(),
      description: newClass.value.description || undefined,
    })
    ElMessage.success(t('schema.createSuccess'))
    dialogVisible.value = false
    newClass.value = { class: '', description: '' }
    await fetchSchema()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('schema.createFailed'))
  } finally {
    formLoading.value = false
  }
}

function viewObjects(cls: WeaviateClass) {
  router.push({ path: '/objects', query: { class: cls.class } })
}

function viewProperties(cls: WeaviateClass) {
  selectedClassForProps.value = cls
  propertiesDialogVisible.value = true
}

async function viewShards(cls: WeaviateClass) {
  selectedClassForProps.value = cls
  shardsDialogVisible.value = true
  shardsLoading.value = true
  try {
    shards.value = await getShards(cls.class)
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('schema.getShardsFailed'))
    shards.value = []
  } finally {
    shardsLoading.value = false
  }
}

function openAddProperty() {
  addPropertyForm.value = { name: '', dataType: 'string', description: '', tokenization: '' }
  addPropertyDialogVisible.value = true
}

async function handleAddProperty() {
  if (!selectedClassForProps.value || !addPropertyForm.value.name.trim()) {
    ElMessage.warning(t('schema.inputPropertyName'))
    return
  }
  addPropertyLoading.value = true
  try {
    await addProperty(selectedClassForProps.value.class, {
      name: addPropertyForm.value.name.trim(),
      dataType: [addPropertyForm.value.dataType],
      description: addPropertyForm.value.description || undefined,
      tokenization: addPropertyForm.value.tokenization || undefined,
    })
    ElMessage.success(t('schema.addSuccess'))
    addPropertyDialogVisible.value = false
    await fetchSchema()
    if (selectedClassForProps.value) {
      selectedClassForProps.value = await getClass(selectedClassForProps.value.class)
    }
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('schema.addFailed'))
  } finally {
    addPropertyLoading.value = false
  }
}

const selectedProperties = computed(() => selectedClassForProps.value?.properties ?? [])

function showPropertyConfig(prop: WeaviateProperty) {
  propertyConfigJson.value = JSON.stringify(prop, null, 2)
  propertyConfigDialogVisible.value = true
}

async function handleDelete(cls: WeaviateClass) {
  try {
    await ElMessageBox.confirm(
      t('schema.deleteConfirm', { name: cls.class }),
      t('schema.warning'),
      {
        type: 'warning',
        confirmButtonText: t('common.delete'),
        cancelButtonText: t('common.cancel'),
      }
    )
    await deleteClass(cls.class)
    ElMessage.success(t('schema.deleteSuccess'))
    await fetchSchema()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e instanceof Error ? e.message : t('schema.deleteFailed'))
    }
  }
}

const classes = computed(() => schema.value?.classes ?? [])

onMounted(fetchSchema)
</script>

<template>
  <div class="page-content">
    <ElCard shadow="never">
      <div class="flex-between" style="margin-bottom: 16px">
        <span>{{ t('schema.collectionCount', { count: classes.length }) }}</span>
        <ElButton type="primary" @click="dialogVisible = true">
          {{ t('schema.createCollection') }}
        </ElButton>
      </div>

      <ElTable
        v-loading="loading"
        :data="classes"
        stripe
      >
        <ElTableColumn prop="class" :label="t('schema.name')" min-width="120">
          <template #default="{ row }">
            <ElTag type="info" size="large">{{ row.class }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="description" :label="t('schema.description')" min-width="180" show-overflow-tooltip />
        <ElTableColumn prop="vectorizer" :label="t('schema.vectorizer')" width="140">
          <template #default="{ row }">
            {{ row.vectorizer ?? '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('schema.viewProperties')" width="120">
          <template #default="{ row }">
            <ElButton
              v-if="(row.properties?.length ?? 0) > 0"
              type="primary"
              link
              size="small"
              @click="viewProperties(row)"
            >
              {{ t('schema.propsCount', { n: row.properties?.length ?? 0 }) }}
            </ElButton>
            <span v-else>{{ t('schema.propsCount', { n: 0 }) }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('schema.actions')" width="280" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" :icon="List" @click="viewProperties(row)">
              {{ t('schema.viewProperties') }}
            </ElButton>
            <ElButton type="primary" link size="small" :icon="Connection" @click="viewShards(row)">
              {{ t('schema.shards') }}
            </ElButton>
            <ElButton type="primary" link size="small" :icon="View" @click="viewObjects(row)">
              {{ t('schema.viewObjects') }}
            </ElButton>
            <ElButton type="danger" link size="small" @click="handleDelete(row)">
              {{ t('common.delete') }}
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <ElEmpty v-if="!loading && classes.length === 0" :description="t('schema.emptyCreate')" />
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="t('schema.createCollection')"
      width="480px"
      :close-on-click-modal="false"
    >
      <ElForm :model="newClass" label-width="100px">
        <ElFormItem :label="t('schema.collectionName')" required>
          <ElInput
            v-model="newClass.class"
            placeholder="例如: Article"
            maxlength="64"
            show-word-limit
          />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput
            v-model="newClass.description"
            type="textarea"
            :rows="3"
            placeholder="可选"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">{{ t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="formLoading" @click="handleCreate">
          {{ t('common.create') }}
        </ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="propertiesDialogVisible"
      :title="`${selectedClassForProps?.class ?? ''} - ${t('schema.propertyDetails')}`"
      width="640px"
    >
      <ElTable
        v-if="selectedProperties.length > 0"
        :data="selectedProperties"
        stripe
        max-height="400"
      >
        <ElTableColumn prop="name" :label="t('schema.name')" min-width="120">
          <template #default="{ row }">
            <ElTag type="info">{{ row.name }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t('schema.dataType')" min-width="120">
          <template #default="{ row }">
            {{ Array.isArray(row.dataType) ? row.dataType.join(', ') : row.dataType ?? '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="description" :label="t('schema.description')" min-width="150" show-overflow-tooltip />
        <ElTableColumn prop="tokenization" :label="t('schema.tokenization')" width="100" />
        <ElTableColumn :label="t('schema.config')" width="80">
          <template #default="{ row }">
            <ElButton
              v-if="row.moduleConfig && Object.keys(row.moduleConfig as object).length > 0"
              type="info"
              link
              size="small"
              @click="showPropertyConfig(row)"
            >
              {{ t('schema.view') }}
            </ElButton>
            <span v-else>-</span>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-else :description="t('schema.noProps')" />
      <template #footer>
        <ElButton v-if="selectedClassForProps" type="primary" :icon="Plus" @click="openAddProperty">
          {{ t('schema.addProperty') }}
        </ElButton>
        <ElButton @click="propertiesDialogVisible = false">{{ t('schema.close') }}</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="addPropertyDialogVisible" :title="t('schema.addProperty')" width="480px">
      <ElForm :model="addPropertyForm" label-width="100px">
        <ElFormItem :label="t('schema.propertyName')" required>
          <ElInput v-model="addPropertyForm.name" placeholder="属性名" maxlength="64" />
        </ElFormItem>
        <ElFormItem :label="t('schema.dataType')" required>
          <ElInput v-model="addPropertyForm.dataType" placeholder="如 string, text, int, number, boolean, date" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="addPropertyForm.description" type="textarea" :rows="2" />
        </ElFormItem>
        <ElFormItem :label="t('schema.tokenization')">
          <ElInput v-model="addPropertyForm.tokenization" placeholder="如 word, field" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="addPropertyDialogVisible = false">{{ t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="addPropertyLoading" @click="handleAddProperty">{{ t('schema.addProperty') }}</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="shardsDialogVisible" :title="`${selectedClassForProps?.class ?? ''} - ${t('schema.shards')}`" width="560px">
      <ElTable v-loading="shardsLoading" :data="shards" stripe>
        <ElTableColumn prop="name" :label="t('schema.shardName')" min-width="150" />
        <ElTableColumn prop="status" :label="t('overview.status')" width="100">
          <template #default="{ row }">
            <ElTag :type="row.status === 'READY' ? 'success' : 'warning'" size="small">
              {{ row.status ?? '-' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="objectCount" :label="t('schema.objectCount')" width="100" />
        <ElTableColumn prop="vectorQueueSize" :label="t('schema.vectorQueue')" width="100" />
      </ElTable>
      <ElEmpty v-if="!shardsLoading && shards.length === 0" :description="t('schema.noShards')" />
    </ElDialog>

    <ElDialog
      v-model="propertyConfigDialogVisible"
      :title="t('schema.fullPropertyDef')"
      width="560px"
    >
      <pre class="code-block">{{ propertyConfigJson }}</pre>
    </ElDialog>
  </div>
</template>

<style scoped>
.code-block {
  max-height: 320px;
  overflow: auto;
  padding: 16px;
  border-radius: 8px;
  font-family: ui-monospace, monospace;
  font-size: 13px;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}
</style>
