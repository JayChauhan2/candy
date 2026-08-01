import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const material = (color: number, emissive = 0) => new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: emissive ? .38 : 0, roughness: .82, flatShading: true })

export const RubyBattleMap = ({ onBack }: { onBack: () => void }) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const [chatOpen, setChatOpen] = useState(true)

  useEffect(() => {
    const host = mountRef.current
    if (!host) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x4b2033)
    scene.fog = new THREE.Fog(0x4b2033, 36, 86)
    const camera = new THREE.OrthographicCamera(-24, 24, 13.5, -13.5, .1, 140)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    host.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xffd5cc, 0x2c1726, 2.3))
    const sun = new THREE.DirectionalLight(0xffb4a8, 2.5)
    sun.position.set(-20, 30, 18); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.left = -45; sun.shadow.camera.right = 45; sun.shadow.camera.top = 35; sun.shadow.camera.bottom = -35
    scene.add(sun)

    const world = new THREE.Group(); scene.add(world)
    const rubyCenter = new THREE.Vector3(-35, 0, 0)
    const homeCenter = new THREE.Vector3(16, 0, 1)
    const base = new THREE.Mesh(new THREE.PlaneGeometry(128, 72), material(0x542435))
    base.rotation.x = -Math.PI / 2; base.position.y = -.08; base.receiveShadow = true; world.add(base)

    const makeRoad = (from: THREE.Vector3, to: THREE.Vector3) => {
      const middle = new THREE.Vector3((from.x + to.x) / 2, .12, -2.2)
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(from.x + 8, .12, from.z), middle, new THREE.Vector3(to.x - 8, .12, to.z)])
      const left: THREE.Vector2[] = [], right: THREE.Vector2[] = []
      for (let i = 0; i <= 30; i++) {
        const point = curve.getPoint(i / 30), tangent = curve.getTangent(i / 30).normalize()
        const half = 2.35 + Math.sin(i * .9) * .12
        left.push(new THREE.Vector2(point.x - tangent.z * half, -point.z - tangent.x * half))
        right.push(new THREE.Vector2(point.x + tangent.z * half, -point.z + tangent.x * half))
      }
      const shape = new THREE.Shape(); shape.moveTo(left[0].x, left[0].y); left.slice(1).forEach(point => shape.lineTo(point.x, point.y)); right.reverse().forEach(point => shape.lineTo(point.x, point.y)); shape.closePath()
      const road = new THREE.Mesh(new THREE.ShapeGeometry(shape), material(0x3b2030)); road.geometry.rotateX(-Math.PI / 2); road.position.y = .13; road.receiveShadow = true; world.add(road)
      for (let i = 2; i < 18; i += 3) {
        const point = curve.getPoint(i / 20)
        const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(.18 + (i % 3) * .04), material(0x815062))
        stone.position.set(point.x + (i % 2 ? .9 : -1.1), .23, point.z + .55); stone.scale.y = .42; world.add(stone)
      }
    }
    makeRoad(rubyCenter, homeCenter)

    const rotors: THREE.Group[] = []
    const crystals: THREE.Mesh[] = []
    const addTower = (parent: THREE.Group, x: number, z: number, height: number, wall: number, roof: number) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(.92, 1.08, height, 9), material(wall)); tower.position.set(x, height / 2 + .35, z); tower.castShadow = true; parent.add(tower)
      const cap = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.55, 7), material(roof)); cap.position.set(x, height + 1.1, z); cap.castShadow = true; parent.add(cap)
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1, .09, 6, 9), material(0xe2b867)); rim.rotation.x = Math.PI / 2; rim.position.set(x, height + .2, z); parent.add(rim)
      const slit = new THREE.Mesh(new THREE.PlaneGeometry(.18, .52), material(0xffd67a, 0xff9f48)); slit.position.set(x, height * .62 + .35, z + 1.085); parent.add(slit)
    }
    const addCottage = (parent: THREE.Group, x: number, z: number, wall: number, roof: number) => {
      const home = new THREE.Group(); home.position.set(x, .32, z); parent.add(home)
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.2, 1.62, 8), material(wall)); body.position.y = .82; body.castShadow = true; home.add(body)
      const eave = new THREE.Mesh(new THREE.TorusGeometry(1.12, .08, 6, 8), material(0xf2d797)); eave.rotation.x = Math.PI / 2; eave.position.y = 1.58; home.add(eave)
      const cap = new THREE.Mesh(new THREE.ConeGeometry(1.48, 1.62, 7), material(roof)); cap.position.y = 2.42; cap.castShadow = true; home.add(cap)
      const door = new THREE.Mesh(new THREE.PlaneGeometry(.42, .78), material(0x4b2b31)); door.position.set(0, .65, 1.08); door.rotation.y = Math.PI; home.add(door)
      ;[-.42, .42].forEach(side => { const window = new THREE.Mesh(new THREE.CircleGeometry(.13, 7), material(0x77a5c0, 0x4e77a0)); window.position.set(side, 1.02, 1.0); window.rotation.y = Math.PI; home.add(window) })
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(.13, .17, .62, 6), material(0x835e49)); chimney.position.set(.48, 2.72, .08); home.add(chimney)
    }
    const addRealm = (center: THREE.Vector3, enemy: boolean) => {
      const realm = new THREE.Group(); realm.position.copy(center); world.add(realm)
      const land = new THREE.Mesh(new THREE.CircleGeometry(15.8, 48), material(enemy ? 0x8e3549 : 0xa5505e))
      land.rotation.x = -Math.PI / 2; land.scale.z = .7; land.position.y = .01; land.receiveShadow = true; realm.add(land)
      const plaza = new THREE.Mesh(new THREE.CircleGeometry(4.3, 32), material(0x4a2634)); plaza.rotation.x = -Math.PI / 2; plaza.position.y = .08; realm.add(plaza)
      if (enemy) {
        const footing = new THREE.Mesh(new THREE.CylinderGeometry(4.9, 5.25, 1.1, 9), material(0x592d3a)); footing.position.y = .54; footing.castShadow = true; realm.add(footing)
        const palace = new THREE.Mesh(new THREE.BoxGeometry(4.6, 4.6, 4), material(0xac4654)); palace.position.set(0, 2.65, .2); palace.castShadow = true; realm.add(palace)
        const gate = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.7, .09), material(0x3a1c2b)); gate.position.set(0, 1.25, 2.23); realm.add(gate)
        ;[-1.25, 0, 1.25].forEach(x => { const window = new THREE.Mesh(new THREE.CircleGeometry(.2, 7), material(0xffd36e, 0xffb63d)); window.position.set(x, 3.25, 2.25); realm.add(window) })
        addTower(realm, -3.15, -2.9, 4.4, 0x9b3f4d, 0x631c37); addTower(realm, 3.15, -2.9, 4.4, 0x9b3f4d, 0x631c37); addTower(realm, -3.15, 2.9, 3.95, 0x9b3f4d, 0x631c37); addTower(realm, 3.15, 2.9, 3.95, 0x9b3f4d, 0x631c37)
        const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(1.05), material(0xff4666, 0xff3554)); jewel.position.set(0, 6.15, .2); jewel.scale.y = 1.55; realm.add(jewel); crystals.push(jewel)
        ;[[-9, 6], [9, 5], [-10, -7]].forEach(([x, z]) => { const shard = new THREE.Mesh(new THREE.OctahedronGeometry(.55), material(0xe94461, 0xff2244)); shard.position.set(x, .9, z); shard.scale.y = 1.8; realm.add(shard); crystals.push(shard) })
        addCottage(realm, -9, -6, 0xa34655, 0x68203b); addCottage(realm, 8, 7, 0xa34655, 0x68203b)
      } else {
        const footing = new THREE.Mesh(new THREE.CylinderGeometry(4.75, 5.05, 1.05, 9), material(0x777a74)); footing.position.y = .52; footing.castShadow = true; realm.add(footing)
        const keep = new THREE.Mesh(new THREE.BoxGeometry(4.4, 4.6, 3.8), material(0xd4c0a8)); keep.position.set(0, 2.65, .2); keep.castShadow = true; realm.add(keep)
        const gate = new THREE.Mesh(new THREE.BoxGeometry(1.08, 1.68, .08), material(0x694534)); gate.position.set(0, 1.22, 2.13); realm.add(gate)
        ;[-1.2, 0, 1.2].forEach(x => { const window = new THREE.Mesh(new THREE.PlaneGeometry(.28, .72), material(0x5b88ad)); window.position.set(x, 3.2, 2.12); realm.add(window) })
        addTower(realm, -3.1, -2.85, 4.2, 0xb4a99b, 0x6988a2); addTower(realm, 3.1, -2.85, 4.2, 0xb4a99b, 0x6988a2); addTower(realm, -3.1, 2.85, 3.85, 0xb4a99b, 0x6988a2); addTower(realm, 3.1, 2.85, 3.85, 0xb4a99b, 0x6988a2)
        ;[[-9, 6], [-10, -7], [9, 7], [10, -6]].forEach(([x, z], index) => addCottage(realm, x, z, index % 2 ? 0xe2b873 : 0xdba76f, index % 2 ? 0x647a96 : 0xc56548))
        const mill = new THREE.Group(); mill.position.set(8.7, .34, -9); realm.add(mill)
        const body = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.3, 3.7, 8), material(0xe2bd6c)); body.position.y = 1.85; mill.add(body)
        const roof = new THREE.Mesh(new THREE.ConeGeometry(1.35, 1.55, 7), material(0x4e7cac)); roof.position.y = 4.45; mill.add(roof)
        const rotor = new THREE.Group(); rotor.position.set(0, 2.9, 1.06); mill.add(rotor); rotors.push(rotor)
        for (let i = 0; i < 4; i++) { const blade = new THREE.Mesh(new THREE.BoxGeometry(.28, 1.5, .07), material(i % 2 ? 0xf0c75d : 0x547fb0)); blade.position.set(Math.sin(i * Math.PI / 2) * .63, Math.cos(i * Math.PI / 2) * .63, 0); blade.rotation.z = -i * Math.PI / 2; rotor.add(blade) }
      }
      const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .65), new THREE.MeshBasicMaterial({ color: enemy ? 0xff5570 : 0xf2c357, side: THREE.DoubleSide }))
      banner.position.set(0, 7.1, .25); realm.add(banner)
    }
    addRealm(rubyCenter, true); addRealm(homeCenter, false)

    // Only the unused edges get trees; the route remains a readable battlefield.
    for (let i = 0; i < 34; i++) {
      const x = -55 + (i % 17) * 6.8, z = i < 17 ? -25 : 24
      const tree = new THREE.Group(); tree.position.set(x, .25, z); world.add(tree)
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.13, .22, 1.25, 6), material(0x3d2230)); trunk.position.y = .63; tree.add(trunk)
      const crown = new THREE.Mesh(new THREE.OctahedronGeometry(.75, 0), material(i % 3 ? 0x722c46 : 0x96354e)); crown.position.y = 1.72; crown.scale.y = 1.55; tree.add(crown)
    }

    const resize = () => { const { width, height } = host.getBoundingClientRect(), aspect = width / height; camera.left = -13.5 * aspect; camera.right = 13.5 * aspect; camera.top = 13.5; camera.bottom = -13.5; renderer.setSize(width, height, false); camera.updateProjectionMatrix() }
    resize(); window.addEventListener('resize', resize)
    const yaw = Math.atan2(27, 24), introStarted = performance.now() * .001
    let panX = rubyCenter.x, panZ = rubyCenter.z, targetX = rubyCenter.x, targetZ = rubyCenter.z, zoom = 1.22, targetZoom = 1.22, dragging = false, lastX = 0, lastY = 0, frame = 0
    const down = (event: PointerEvent) => { dragging = true; lastX = event.clientX; lastY = event.clientY; host.setPointerCapture(event.pointerId) }
    const move = (event: PointerEvent) => { if (!dragging) return; const dx = event.clientX - lastX, dy = event.clientY - lastY, pan = .058 / zoom; targetX = Math.max(-47, Math.min(28, targetX - dx * Math.cos(yaw) * pan - dy * Math.sin(yaw) * pan)); targetZ = Math.max(-18, Math.min(18, targetZ + dx * Math.sin(yaw) * pan - dy * Math.cos(yaw) * pan)); lastX = event.clientX; lastY = event.clientY }
    const up = (event: PointerEvent) => { dragging = false; if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId) }
    const wheel = (event: WheelEvent) => { event.preventDefault(); targetZoom = Math.max(.76, Math.min(1.5, targetZoom - event.deltaY * .0012)) }
    host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move); host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up); host.addEventListener('wheel', wheel, { passive: false })
    const animate = () => { frame = requestAnimationFrame(animate); const time = performance.now() * .001, intro = Math.min(1, Math.max(0, (time - introStarted - .55) / 2.2)), ease = intro * intro * (3 - 2 * intro); if (intro < 1) { targetX = rubyCenter.x + (homeCenter.x - rubyCenter.x) * ease; targetZ = rubyCenter.z + (homeCenter.z - rubyCenter.z) * ease; targetZoom = 1.22 - .42 * ease } panX += (targetX - panX) * .13; panZ += (targetZ - panZ) * .13; zoom += (targetZoom - zoom) * .13; camera.zoom = zoom; camera.updateProjectionMatrix(); camera.position.set(Math.cos(yaw) * 35 + panX, 29, Math.sin(yaw) * 35 + panZ); camera.lookAt(panX, .7, panZ); rotors.forEach(rotor => { rotor.rotation.z = time * .9 }); crystals.forEach((crystal, index) => { crystal.scale.y = (index === 0 ? 1.55 : 1.8) + Math.sin(time * 2 + index) * .08 }); renderer.render(scene, camera) }
    animate()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move); host.removeEventListener('pointerup', up); host.removeEventListener('pointercancel', up); host.removeEventListener('wheel', wheel); renderer.dispose(); if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement) }
  }, [])

  return <section className="ruby-battle-map" aria-label="Empress Ruby battle map"><div ref={mountRef} className="ruby-battle-canvas" /><header><span>EMPRESS RUBY'S DOMAIN</span><b>CRIMSON JEWEL KINGDOM</b></header><button className="ruby-retreat" onClick={onBack}>‹ <span>RETREAT</span></button><aside className={`ruby-chat${chatOpen ? '' : ' closed'}`}><button className="ruby-chat-title" onClick={() => setChatOpen(!chatOpen)}>FIELD CHAT <span>{chatOpen ? '−' : '+'}</span></button>{chatOpen && <><div className="ruby-chat-log"><p><b>SCOUT:</b> Ruby palace is across the marchway.</p><p><b>YOU:</b> The road is clear. Hold formation.</p></div><div className="ruby-chat-quick"><button>Rally here</button><button>Need support</button></div></>}</aside><aside className="ruby-commands"><p>BATTLE COMMANDS</p><b>YOUR KINGDOM</b><small>3 squads ready · 2 actions</small><div><button>⚔<em>MARCH</em></button><button>◈<em>SCOUT</em></button><button>♜<em>FORTIFY</em></button><button>✦<em>RALLY</em></button></div><button className="ruby-end-turn">END TURN ›</button></aside><div className="ruby-pan-tip">DRAG THE MAP TO PAN · SCROLL TO ZOOM</div></section>
}
