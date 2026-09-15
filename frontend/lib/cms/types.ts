import * as React from "react"

export type CmsPageStatus = "draft" | "published" | "archived"
export type CmsPageType = "page_builder" | "custom_developer"

export interface CmsPage {
  id: string
  slug: string
  title: string
  type: CmsPageType
  status: CmsPageStatus
  seoTitle?: string | null
  seoDescription?: string | null
  ogImage?: string | null
  canonicalUrl?: string | null
  noIndex?: boolean
  authorId?: string | null
  updatedById?: string | null
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
  sections?: CmsSection[]
}

export interface CmsSection<T = Record<string, any>> {
  id: string
  pageId?: string
  type: string
  order: number
  props: T
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CmsMedia {
  id: string
  filename: string
  url: string
  altText?: string | null
  fileSize?: number | null
  mimeType?: string | null
  width?: number | null
  height?: number | null
  uploadedById?: string | null
  createdAt: string
}

export interface CmsPageVersion {
  id: string
  pageId: string
  versionNumber: number
  snapshot: string
  createdById?: string | null
  createdAt: string
}

export type FieldType =
  | "text"
  | "textarea"
  | "richText"
  | "media"
  | "select"
  | "number"
  | "boolean"
  | "list"
  | "table"

export interface SectionFieldSchema {
  key: string
  label: string
  type: FieldType
  description?: string
  options?: Array<{ label: string; value: any }>
  defaultValue?: any
  itemFields?: SectionFieldSchema[] // For lists / arrays of objects
}

export interface SectionDefinition<T = any> {
  type: string
  name: string
  category: "Layout" | "Content" | "Interactive" | "Data"
  description: string
  icon: string
  component: React.ComponentType<T>
  defaultProps: T
  schema: {
    fields: SectionFieldSchema[]
  }
}
