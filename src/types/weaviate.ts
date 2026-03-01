/** Weaviate REST API 类型定义 */

export interface WeaviateMeta {
  version?: string
  modules?: Record<string, { name?: string; documentationHref?: string }>
  hostname?: string
  grpcMaxMessageSize?: number
  [key: string]: unknown
}

export interface WeaviateClass {
  class: string
  description?: string
  vectorizer?: string
  vectorIndexConfig?: Record<string, unknown>
  vectorIndexType?: string
  properties?: WeaviateProperty[]
  invertedIndexConfig?: Record<string, unknown>
  [key: string]: unknown
}

export interface WeaviateProperty {
  name: string
  dataType: string[]
  description?: string
  tokenization?: string
  moduleConfig?: Record<string, unknown>
  [key: string]: unknown
}

export interface WeaviateSchema {
  classes?: WeaviateClass[]
}

export interface WeaviateObject {
  id?: string
  class?: string
  properties?: Record<string, unknown>
  vector?: number[]
  creationTimeUnix?: number
  lastUpdateTimeUnix?: number
  tenant?: string
}

export interface ObjectsListResponse {
  objects?: WeaviateObject[]
  totalResults?: number
}

export interface GraphQLQuery {
  query: string
  variables?: Record<string, unknown>
}

/** 节点状态 */
export interface WeaviateNode {
  name: string
  version?: string
  gitHash?: string
  status?: 'HEALTHY' | 'UNHEALTHY' | 'UNAVAILABLE' | 'TIMEOUT'
  shards?: unknown[]
  batchStats?: { queueLength?: number; ratePerSecond?: number }
  operationalMode?: string
}

export interface NodesResponse {
  nodes?: WeaviateNode[]
}

/** Shard 信息 */
export interface ShardStatus {
  name: string
  class?: string
  objectCount?: number
  vectorIndexingStatus?: string
  [key: string]: unknown
}

/** 分类任务 */
export interface Classification {
  id?: string
  class?: string
  basedOnProperties?: string[]
  classifiedProperties?: string[]
  status?: string
  meta?: { completed?: string; started?: string }
  [key: string]: unknown
}

/** 批量对象请求 */
export interface BatchObjectRequest {
  objects: Array<{
    class?: string
    properties?: Record<string, unknown>
    id?: string
  }>
}

/** 批量对象响应：Weaviate 返回数组 */
export type BatchObjectResponse = Array<{ id?: string; result?: { errors?: { error?: string } } }>
