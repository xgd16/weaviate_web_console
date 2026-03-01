import axios, { type AxiosInstance } from 'axios'
import { useSettingsStore } from '@/stores/settings'
import type {
  WeaviateMeta,
  WeaviateSchema,
  WeaviateClass,
  WeaviateProperty,
  WeaviateObject,
  ObjectsListResponse,
  NodesResponse,
  ShardStatus,
  Classification,
  BatchObjectRequest,
  BatchObjectResponse,
} from '@/types/weaviate'

let cachedClient: AxiosInstance | null = null
let cachedBaseUrl = ''

function getApiClient(): AxiosInstance {
  const store = useSettingsStore()
  const baseURL = store.apiRequestBase
  if (cachedClient && cachedBaseUrl === baseURL) {
    return cachedClient
  }
  cachedBaseUrl = baseURL
  cachedClient = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  })
  return cachedClient
}

/** 健康检查 */
export async function checkLiveness(): Promise<boolean> {
  try {
    const { status } = await getApiClient().get('/.well-known/live')
    return status === 200
  } catch {
    return false
  }
}

/** 健康检查（含响应时间，用于曲线图） */
export async function checkLivenessWithTiming(): Promise<{ ok: boolean; ms: number }> {
  const start = performance.now()
  try {
    const ok = await checkLiveness()
    return { ok, ms: Math.round(performance.now() - start) }
  } catch {
    return { ok: false, ms: Math.round(performance.now() - start) }
  }
}

/** 就绪检查 */
export async function checkReadiness(): Promise<boolean> {
  try {
    const { status } = await getApiClient().get('/.well-known/ready')
    return status === 200
  } catch {
    return false
  }
}

/** 获取实例元数据 */
export async function getMeta(): Promise<WeaviateMeta> {
  const { data } = await getApiClient().get<WeaviateMeta>('/meta')
  return data
}

/** 获取集群节点状态 */
export async function getNodes(): Promise<NodesResponse> {
  const { data } = await getApiClient().get<NodesResponse>('/nodes')
  return data
}

/** 获取完整 Schema */
export async function getSchema(): Promise<WeaviateSchema> {
  const { data } = await getApiClient().get<WeaviateSchema>('/schema')
  return data
}

/** 获取单个 Collection 定义 */
export async function getClass(className: string): Promise<WeaviateClass> {
  const { data } = await getApiClient().get<WeaviateClass>(`/schema/${className}`)
  return data
}

/** 创建 Collection */
export async function createClass(cls: WeaviateClass): Promise<WeaviateClass> {
  const { data } = await getApiClient().post<WeaviateClass>('/schema', cls)
  return data
}

/** 删除 Collection */
export async function deleteClass(className: string): Promise<void> {
  await getApiClient().delete(`/schema/${className}`)
}

/** 更新 Collection */
export async function updateClass(className: string, cls: Partial<WeaviateClass>): Promise<WeaviateClass> {
  const { data } = await getApiClient().put<WeaviateClass>(`/schema/${className}`, cls)
  return data
}

/** 添加属性到 Collection */
export async function addProperty(className: string, property: WeaviateProperty): Promise<void> {
  await getApiClient().post(`/schema/${className}/properties`, property)
}

/** 获取 Collection 的 Shards */
export async function getShards(className: string): Promise<ShardStatus[]> {
  const { data } = await getApiClient().get<ShardStatus[] | { shards?: ShardStatus[] }>(`/schema/${className}/shards`)
  return Array.isArray(data) ? data : (data as { shards?: ShardStatus[] })?.shards ?? []
}

/** 列出对象 */
export async function listObjects(params: {
  class?: string
  limit?: number
  offset?: number
  include?: string
  sort?: string
  order?: string
}): Promise<ObjectsListResponse> {
  const { data } = await getApiClient().get<ObjectsListResponse>('/objects', { params })
  return data
}

/** 验证对象（不创建） */
export async function validateObject(obj: WeaviateObject): Promise<{ valid: boolean; error?: string }> {
  try {
    await getApiClient().post('/objects/validate', obj)
    return { valid: true }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } }
    return { valid: false, error: err.response?.data?.error ?? (e instanceof Error ? e.message : '验证失败') }
  }
}

/** 获取单个对象 */
export async function getObject(
  id: string,
  className?: string,
  options?: { include?: string }
): Promise<WeaviateObject> {
  const url = className ? `/objects/${className}/${id}` : `/objects/${id}`
  const { data } = await getApiClient().get<WeaviateObject>(url, {
    params: options?.include ? { include: options.include } : undefined,
  })
  return data
}

/** 创建对象 */
export async function createObject(obj: WeaviateObject): Promise<WeaviateObject> {
  const { data } = await getApiClient().post<WeaviateObject>('/objects', obj)
  return data
}

/** 批量创建对象（返回结果为数组） */
export async function batchCreateObjects(batch: BatchObjectRequest): Promise<BatchObjectResponse> {
  const { data } = await getApiClient().post<BatchObjectResponse>('/batch/objects', batch)
  return Array.isArray(data) ? data : []
}

/** 更新对象 (PATCH) */
export async function patchObject(
  id: string,
  patch: Partial<WeaviateObject>,
  className?: string
): Promise<void> {
  const url = className ? `/objects/${className}/${id}` : `/objects/${id}`
  await getApiClient().patch(url, patch)
}

/** 删除对象 */
export async function deleteObject(id: string, className?: string): Promise<void> {
  const url = className ? `/objects/${className}/${id}` : `/objects/${id}`
  await getApiClient().delete(url)
}

/** 批量删除对象（逐个调用删除接口，返回成功与失败数量） */
export async function batchDeleteObjects(
  ids: string[],
  className?: string
): Promise<{ ok: number; failed: number }> {
  const results = await Promise.allSettled(
    ids.map((id) => deleteObject(id, className))
  )
  const ok = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length
  return { ok, failed }
}

/** GraphQL 查询 */
export async function graphqlQuery<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const { data } = await getApiClient().post<{ data: T }>('/graphql', { query, variables })
  return data.data
}

/** 创建分类任务（POST，无列表接口） */
export async function createClassification(params: Classification): Promise<Classification> {
  const { data } = await getApiClient().post<Classification>('/classifications/', params)
  return data
}

/** 获取单个分类任务状态 */
export async function getClassification(id: string): Promise<Classification> {
  const { data } = await getApiClient().get<Classification>(`/classifications/${id}`)
  return data
}
