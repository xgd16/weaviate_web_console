<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()
const store = useSettingsStore()
const apiBaseUrl = ref(store.apiBaseUrl)
const saving = ref(false)

watch(() => props.modelValue, (visible) => {
  if (visible) {
    apiBaseUrl.value = store.apiBaseUrl
  }
})

function handleClose() {
  emit('update:modelValue', false)
}

async function handleSave() {
  const url = apiBaseUrl.value.trim().replace(/\/+$/, '')
  if (!url) {
    ElMessage.warning(t('apiSettings.inputRequired'))
    return
  }
  try {
    new URL(url.startsWith('http') ? url : `http://${url}`)
  } catch {
    ElMessage.warning(t('apiSettings.invalidUrl'))
    return
  }
  saving.value = true
  try {
    store.setApiBaseUrl(url)
    ElMessage.success(t('apiSettings.saved'))
    emit('update:modelValue', false)
  } finally {
    saving.value = false
  }
}

function handleReset() {
  apiBaseUrl.value = 'http://127.0.0.1:8182'
}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    :title="t('apiSettings.title')"
    width="480px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <ElForm :model="{ apiBaseUrl }" label-width="100px">
      <ElFormItem :label="t('apiSettings.apiAddress')" required>
        <ElInput
          v-model="apiBaseUrl"
          :placeholder="t('apiSettings.apiAddressPlaceholder')"
          clearable
          @keyup.enter="handleSave"
        />
      </ElFormItem>
      <ElFormItem>
        <span class="form-hint">{{ t('apiSettings.apiHint') }}</span>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="handleReset">{{ t('common.reset') }}</ElButton>
      <ElButton @click="handleClose">{{ t('common.cancel') }}</ElButton>
      <ElButton type="primary" :loading="saving" @click="handleSave">
        {{ t('common.save') }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.form-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
