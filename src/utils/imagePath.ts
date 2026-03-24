import { getContextPath } from './context'

/** 与旧站 getImagePath 一致：contextPath + '/' + imageName */
export function getImagePath(imageName) {
  if (!imageName) return ''
  const ctx = getContextPath()
  const path = imageName.startsWith('/') ? imageName.slice(1) : imageName
  return `${ctx}/${path}`
}
