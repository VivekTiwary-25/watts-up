import * as THREE from 'three'

export function hideShell(root: THREE.Object3D): string[] {
  root.updateWorldMatrix(true, true)
  const house = new THREE.Box3().setFromObject(root)
  const height = house.max.y - house.min.y
  const yCut = house.min.y + height * 0.78
  const bounds = new THREE.Box3()
  const hidden: string[] = []

  root.traverse((object) => {
    if (/(^|[^a-z])(roof|ceiling|ceil|attic|soffit|top)([^a-z]|$)/i.test(object.name)) {
      object.visible = false
      hidden.push(object.name)
      return
    }
    if (!(object instanceof THREE.Mesh)) return
    bounds.setFromObject(object)
    if (bounds.max.y - bounds.min.y < height * 0.12 && bounds.min.y >= yCut) {
      object.visible = false
      hidden.push(object.name)
    }
  })

  return hidden
}
