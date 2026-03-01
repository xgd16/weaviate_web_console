<script setup lang="ts">
import { ref } from 'vue'
import { ElCard, ElButton, ElMessage } from 'element-plus'
import { MagicStick, CopyDocument } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { parse, print } from 'graphql'
import { graphqlQuery } from '@/api/weaviate'
import CodeEditor from '@/components/CodeEditor.vue'

const query = ref(`{
  Get {
    _schema {
      classes {
        name
      }
    }
  }
}`)
const { t } = useI18n()
const result = ref('')
const loading = ref(false)

function copyResult() {
  if (!result.value) return
  navigator.clipboard.writeText(result.value).then(
    () => ElMessage.success(t('graphql.copySuccess')),
    () => ElMessage.error(t('graphql.copyFailed'))
  )
}

function formatQuery() {
  try {
    const ast = parse(query.value)
    query.value = print(ast)
    ElMessage.success(t('graphql.formatSuccess'))
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('graphql.formatFailed'))
  }
}

async function execute() {
  if (!query.value.trim()) {
    ElMessage.warning(t('graphql.inputRequired'))
    return
  }
  loading.value = true
  result.value = ''
  try {
    const data = await graphqlQuery(query.value)
    result.value = JSON.stringify(data, null, 2)
  } catch (e) {
    result.value = JSON.stringify(
      { error: e instanceof Error ? e.message : t('graphql.queryError') },
      null,
      2
    )
    ElMessage.error(t('graphql.queryFailed'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-content">
    <ElCard shadow="never">
      <template #header>
        <div class="flex-between">
          <span>{{ t('graphql.title') }}</span>
          <div class="graphql-actions">
            <ElButton :icon="MagicStick" @click="formatQuery">{{ t('common.format') }}</ElButton>
            <ElButton type="primary" :loading="loading" @click="execute">
              {{ t('common.execute') }}
            </ElButton>
          </div>
        </div>
      </template>
      <CodeEditor
        v-model="query"
        language="graphql"
        :placeholder="t('graphql.placeholder')"
        min-height="200px"
      />
    </ElCard>

    <ElCard v-if="result" shadow="never">
      <template #header>
        <div class="flex-between">
          <span>{{ t('graphql.result') }}</span>
          <ElButton :icon="CopyDocument" size="small" @click="copyResult">{{ t('common.copy') }}</ElButton>
        </div>
      </template>
      <CodeEditor
        :model-value="result"
        language="json"
        min-height="240px"
        :readonly="true"
      />
    </ElCard>
  </div>
</template>

<style scoped>
.graphql-actions {
  display: flex;
  gap: 8px;
}
</style>
