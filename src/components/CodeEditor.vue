<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import graphql from '@/highlight/graphql'
import 'highlight.js/styles/github.min.css'
import '@/styles/hljs-dark.css'

hljs.registerLanguage('json', json)
hljs.registerLanguage('graphql', graphql)

const props = withDefaults(
  defineProps<{
    modelValue: string
    language?: 'graphql' | 'json'
    placeholder?: string
    minHeight?: string
    readonly?: boolean
  }>(),
  { language: 'graphql', placeholder: '', minHeight: '280px', readonly: false }
)

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const textareaRef = ref<HTMLTextAreaElement>()
const highlightRef = ref<HTMLPreElement>()
defineExpose({ textareaRef, highlightRef })

const lineCount = computed(() => {
  const n = props.modelValue.split('\n').length
  return n < 1 ? 1 : n
})

function highlightCode(code: string): string {
  if (!code.trim()) return ''
  try {
    const lang = props.language === 'json' ? 'json' : 'graphql'
    return hljs.highlight(code, { language: lang }).value
  } catch {
    return escapeHtml(code)
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function handleInput(e: Event) {
  const v = (e.target as HTMLTextAreaElement).value
  emit('update:modelValue', v)
}

function handleKeydown(e: KeyboardEvent) {
  const el = e.target as HTMLTextAreaElement
  if (e.key === 'Tab') {
    e.preventDefault()
    const start = el.selectionStart
    const end = el.selectionEnd
    const val = props.modelValue
    el.value = val.slice(0, start) + '  ' + val.slice(end)
    el.selectionStart = el.selectionEnd = start + 2
    emit('update:modelValue', el.value)
  }
}

const highlightedHtml = ref('')

watch(
  () => props.modelValue,
  (v) => {
    highlightedHtml.value = highlightCode(v)
  },
  { immediate: true }
)

onMounted(() => {
  highlightedHtml.value = highlightCode(props.modelValue)
})
</script>

<template>
  <div class="code-editor-wrap" :style="{ minHeight, height: minHeight }">
    <div class="code-editor-scroll">
      <div class="code-editor-gutter" aria-hidden="true">
        <span v-for="n in lineCount" :key="n" class="code-editor-line-num">{{ n }}</span>
      </div>
      <div class="code-editor-body">
        <pre
          v-if="readonly"
          ref="highlightRef"
          class="code-editor-highlight hljs"
        ><code class="hljs" v-html="highlightedHtml || ' '"></code></pre>
        <template v-else>
          <pre ref="highlightRef" class="code-editor-highlight hljs" aria-hidden="true"><code class="hljs" v-html="highlightedHtml || ' '"></code></pre>
          <textarea
            ref="textareaRef"
            class="code-editor-input"
            :value="modelValue"
            :placeholder="placeholder"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            @input="handleInput"
            @keydown="handleKeydown"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.code-editor-wrap {
  position: relative;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-fill-color-blank);
}

.code-editor-scroll {
  display: flex;
  overflow: auto;
  height: 100%;
  min-height: inherit;
}

.code-editor-gutter {
  flex-shrink: 0;
  padding: 12px 10px 12px 12px;
  text-align: right;
  user-select: none;
  background: var(--el-fill-color-light);
  border-right: 1px solid var(--el-border-color-lighter);
  font-family: ui-monospace, 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

html.dark .code-editor-gutter {
  background: var(--el-fill-color-darker);
  border-right-color: var(--el-border-color-dark);
}

.code-editor-line-num {
  display: block;
}

.code-editor-body {
  flex: 1;
  position: relative;
  min-width: 0;
}

.code-editor-highlight {
  margin: 0;
  padding: 12px 15px;
  box-sizing: border-box;
  font-family: ui-monospace, 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 确保 highlight.js 主题色生效，不覆盖其子元素颜色 */
.code-editor-highlight :deep(.hljs) {
  font-family: inherit;
  background: transparent !important;
  padding: 0;
}

/* GraphQL 指令 (@skip, @include, @defer 等) 高亮 */
.code-editor-highlight :deep(.hljs-directive) {
  color: #6f42c1;
  font-weight: 500;
}

.code-editor-input {
  position: absolute;
  inset: 0;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 12px 15px;
  overflow: hidden;
  font-family: ui-monospace, 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  color: transparent;
  caret-color: var(--el-color-primary);
}

.code-editor-input::placeholder {
  color: var(--el-text-color-placeholder);
}

.code-editor-input::selection {
  background: var(--el-color-primary-light-5);
}

html.dark .code-editor-input::selection {
  background: var(--el-color-primary-dark-2);
}
</style>
