import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'

const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

const geometry = new THREE.BoxGeometry(1, 1, 1, 25, 25, 25)
const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

window.addEventListener('dblclick', () => {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement

    if(!fullscreenElement) {
        if(canvas.requestFullscreen) {
            canvas.requestFullscreen()
        } else if (canvas.webkitRequestFullscreen) {
            canvas.webkitRequestFullscreen()
        }
    }
    else {
        if(document.exitFullscreen) {
            document.exitFullscreen()
        }
        else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen()
        }
    }

    // Instantiate an exporter
    const exporter = new OBJExporter()

    const data = exporter.parse( mesh )

    const blob = new Blob([data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mesh.obj'
    link.click()
})

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 3
scene.add(camera)

const transformControls = new TransformControls(camera, canvas)
transformControls.position.set(0.5, 0, 0)
scene.add(transformControls)

const point = new THREE.Mesh(new THREE.SphereGeometry(0.04), new THREE.MeshBasicMaterial())
transformControls.attach(point)
point.position.set(0.5, 0, 0)
scene.add(point)

const mouse = new THREE.Vector2()
window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX / sizes.width * 2 - 1
    mouse.y = - (event.clientY / sizes.height) * 2 + 1
})

let pointOrigin
const cameraDirection = new THREE.Vector3()
const raycaster = new THREE.Raycaster()

window.addEventListener('mousedown', function(event) {
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects([ mesh ])

    if (intersects.length > 0) {
        const posArray = mesh.geometry.attributes.position.array
        const aIndex = intersects[0].face.a * 3
        const a = new THREE.Vector3(posArray[aIndex], posArray[aIndex + 1], posArray[aIndex + 2])
        point.position.copy(a)
    }

    pointOrigin = point.position.clone()
})

window.addEventListener('mouseup', function(event) {
    const shift = point.position.clone().sub(pointOrigin)
    if (shift.length() < 0.01) return

    const radius = 0.5
    const index = mesh.geometry.index.array
    const posArray = mesh.geometry.attributes.position.array
    const positions = mesh.geometry.attributes.position

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z = positions.getZ(i)

      const p = new THREE.Vector3(x, y, z)
      const pointToLine = p.clone().sub(pointOrigin).cross(shift.clone().normalize())
      const d = pointToLine.length()

      if (d > radius) continue

      const f = 1 - (3 * Math.pow(d / radius, 2) - 2 * Math.pow(d / radius, 3))
      positions.setXYZ(i, x + shift.x * f, y + shift.y * f, z + shift.z * f)
    }

    positions.needsUpdate = true
})

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

transformControls.addEventListener('dragging-changed', function (event) {
  controls.enabled = !event.value
})

const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    controls.update()
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()
