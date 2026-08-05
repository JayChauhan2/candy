import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import sunstonePortrait from '../assets/sunstone-clean.png'
import frostpinePortrait from '../assets/frostpine-clean.png'
import emberforgePortrait from '../assets/emberforge-clean.png'
import { addHomeCastle, addHomeHouse, addHomeOutpost } from './KingdomModels'

type Rival = 'Queen Marigold' | 'Duke Bramble' | 'Lord Cinder'

const realms: Record<Rival, { realm: string; sky: number; ground: number; road: number; stone: number; roof: number; leaf: number; accent: number; portrait: string }> = {
  'Queen Marigold': { realm: 'SUNSTONE KINGDOM', sky: 0x91b9c7, ground: 0xb69155, road: 0x725239, stone: 0xe2ba70, roof: 0xd85c36, leaf: 0xb87e37, accent: 0xffdc72, portrait: sunstonePortrait },
  'Duke Bramble': { realm: 'FROSTPINE REALM', sky: 0x8faec5, ground: 0x6f8990, road: 0x42545c, stone: 0xc3d2d5, roof: 0x567e9e, leaf: 0x486f71, accent: 0xc9f4ff, portrait: frostpinePortrait },
  'Lord Cinder': { realm: 'EMBERFORGE EMPIRE', sky: 0x633d43, ground: 0x765047, road: 0x452b2d, stone: 0xa57761, roof: 0x512d37, leaf: 0x7f3833, accent: 0xffb35a, portrait: emberforgePortrait },
}

const mat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: .82, flatShading: true })

export const RivalBattleMap = ({ rival, onBack, startIntro = true }: { rival: Rival; onBack: () => void; startIntro?: boolean }) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const readyRef = useRef(startIntro)
  const [chatOpen, setChatOpen] = useState(true)
  const config = realms[rival]
  useEffect(() => { readyRef.current = startIntro }, [startIntro])
  useEffect(() => {
    const host = mountRef.current
    if (!host) return
    const scene = new THREE.Scene(); scene.background = new THREE.Color(config.sky); scene.fog = new THREE.Fog(config.sky, 35, 88)
    const camera = new THREE.OrthographicCamera(-24, 24, 13.5, -13.5, .1, 140); camera.position.set(28, 30, 29)
    const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.outputColorSpace = THREE.SRGBColorSpace; host.appendChild(renderer.domElement)
    scene.add(new THREE.HemisphereLight(0xfaf2dc, config.ground, 2.25)); const sun = new THREE.DirectionalLight(config.accent, 2.6); sun.position.set(-22, 30, 18); sun.castShadow = true; scene.add(sun)
    const world = new THREE.Group(); scene.add(world)
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 112), mat(config.ground)); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground)
    const roadMat = mat(config.road)
    const addRoad = (x1: number, z1: number, x2: number, z2: number, width = 1.35) => {
      const dx = x2 - x1, dz = z2 - z1, distance = Math.hypot(dx, dz), bend = (Math.sin(x1 * 4 + z2 * 2) < 0 ? -1 : 1) * Math.min(2.3, distance * .14)
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(x1, .05, z1), new THREE.Vector3(x1 + dx * .32 - dz / distance * bend, .05, z1 + dz * .32 + dx / distance * bend), new THREE.Vector3(x1 + dx * .68 + dz / distance * bend, .05, z1 + dz * .68 - dx / distance * bend), new THREE.Vector3(x2, .05, z2)])
      const left: THREE.Vector2[] = [], right: THREE.Vector2[] = []
      for (let i = 0; i <= 24; i++) { const p = curve.getPoint(i / 24), t = curve.getTangent(i / 24).normalize(), edge = width * .5 * (.88 + Math.sin(i * 2.3) * .1); left.push(new THREE.Vector2(p.x - t.z * edge, -p.z - t.x * edge)); right.push(new THREE.Vector2(p.x + t.z * edge, -p.z + t.x * edge)) }
      const shape = new THREE.Shape(); shape.moveTo(left[0].x, left[0].y); left.slice(1).forEach(p => shape.lineTo(p.x, p.y)); right.reverse().forEach(p => shape.lineTo(p.x, p.y)); shape.closePath(); const road = new THREE.Mesh(new THREE.ShapeGeometry(shape), roadMat); road.geometry.rotateX(-Math.PI / 2); road.position.y = .06; world.add(road)
    }
    const addCastle = (x: number, z: number, colors: { stone: number; roof: number; flag: number }) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g)
      const base = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.75, .9, 8), mat(colors.stone)); base.position.y = .45; g.add(base)
      const keep = new THREE.Mesh(new THREE.BoxGeometry(4.15, 4.35, 3.55), mat(colors.stone)); keep.position.y = 2.6; keep.castShadow = true; g.add(keep)
      ;[[-2.8, -2.45], [2.8, -2.45], [-2.8, 2.45], [2.8, 2.45]].forEach(([px, pz], index) => { const tower = new THREE.Mesh(new THREE.CylinderGeometry(.88, 1.02, 3.7 + (index % 2) * .35, 8), mat(colors.stone)); tower.position.set(px, 2.25, pz); tower.castShadow = true; g.add(tower); const roof = new THREE.Mesh(new THREE.ConeGeometry(1.14, 1.55, 6), mat(colors.roof)); roof.position.set(px, 4.85 + (index % 2) * .35, pz); roof.castShadow = true; g.add(roof) })
      const gate = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.55), mat(0x49352f)); gate.position.set(0, 1.25, -1.81); g.add(gate)
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 3, 6), mat(0x744b32)); pole.position.set(0, 6.1, 0); g.add(pole); const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.55, .7), new THREE.MeshBasicMaterial({ color: colors.flag, side: THREE.DoubleSide })); flag.position.set(.78, 7.05, 0); g.add(flag)
    }
    const addHouse = (x: number, z: number, roof: number) => { const g = new THREE.Group(); g.position.set(x, .05, z); world.add(g); const body = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.05, 1.5, 8), mat(0xdabf87)); body.position.y = .78; g.add(body); const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(1.34, 1.45, 6), mat(roof)); roofMesh.position.y = 2.2; roofMesh.castShadow = true; g.add(roofMesh) }
    const addTree = (x: number, z: number, scale: number, variant: number) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale); world.add(g); const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.13, .23, 1.45, 6), mat(0x4a3530)); trunk.position.y = .72; g.add(trunk); for (let i = 0; i < 3; i++) { const crown = new THREE.Mesh(new THREE.ConeGeometry(.75 - i * .1, .95, 7), mat(variant % 2 ? config.leaf : config.roof)); crown.position.y = 1.2 + i * .48; crown.rotation.y = i * .5; crown.castShadow = true; g.add(crown) } }
    const playerX = -16, rivalX = 17
    addHomeCastle(world,mat,playerX,0); addCastle(rivalX, 0, { stone: config.stone, roof: config.roof, flag: config.accent })
    addRoad(playerX + 4.1, 0, rivalX - 4.1, 0, 2.15); addRoad(playerX, -3.8, playerX - 5, -10, .9); addRoad(rivalX, 3.8, rivalX + 5, 10, .9)
    let savedMap:{type?:string;x?:number;z?:number}[]=[];try{savedMap=JSON.parse(window.localStorage.getItem('candy-builder-map-v1')||'[]')}catch{/* no saved map */}
    savedMap.forEach((item,index)=>{if(typeof item.x!=='number'||typeof item.z!=='number')return;const x=playerX+item.x*.42,z=item.z*.42,g=new THREE.Group();g.position.set(x,0,z);if(item.type==='house'){world.add(g);addHomeHouse(g,mat,index%2?0xc85b43:0x627492)}if(item.type==='station1'){world.add(g);addHomeOutpost(g,mat)}if(item.type==='house'||item.type==='station1')addRoad(playerX,0,x,z,.7)})
    ;[[10, -9], [23, 8], [27, -7], [14, 10]].forEach(([x, z], i) => addHouse(x, z, i % 2 ? config.roof : config.leaf))
    for (let i = 0; i < 220; i++) { const a = i * 2.399, r = 31 + (i % 11) * 3.1, x = Math.cos(a) * r * 1.28, z = Math.sin(a) * r * .84; if (Math.abs(z) < 12 && x > -30 && x < 31) continue; addTree(x, z, 1.2 + (i % 4) * .16, i) }
    const resize = () => { const { width, height } = host.getBoundingClientRect(), half = 13.5, aspect = width / height; camera.left = -half * aspect; camera.right = half * aspect; camera.top = half; camera.bottom = -half; renderer.setSize(width, height, false); camera.updateProjectionMatrix() }; resize(); window.addEventListener('resize', resize)
    const yaw = Math.atan2(29, 28); let started: number | null = null, panX = rivalX, targetX = rivalX, zoom = 1.22, targetZoom = 1.22, dragging = false, lastX = 0, lastY = 0, frame = 0
    const down = (event: PointerEvent) => { dragging = true; lastX = event.clientX; lastY = event.clientY; host.setPointerCapture(event.pointerId) }
    const move = (event: PointerEvent) => { if (!dragging) return; const dx = event.clientX - lastX, dy = event.clientY - lastY, speed = .05 / zoom; targetX = Math.max(-28, Math.min(29, targetX - dx * Math.cos(yaw) * speed - dy * Math.sin(yaw) * speed)); lastX = event.clientX; lastY = event.clientY }
    const up = (event: PointerEvent) => { dragging = false; if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId) }
    const wheel = (event: WheelEvent) => { event.preventDefault(); targetZoom = Math.max(.78, Math.min(1.52, targetZoom - event.deltaY * .0012)) }
    host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move); host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up); host.addEventListener('wheel', wheel, { passive: false })
    const animate = () => { frame = requestAnimationFrame(animate); const time = performance.now() * .001; if (started === null && readyRef.current) started = time; const progress = started === null ? 0 : Math.min(1, Math.max(0, (time - started - .55) / 2)); const eased = progress * progress * (3 - 2 * progress); if (progress < 1) { targetX = rivalX + (playerX - rivalX) * eased; targetZoom = 1.22 - .42 * eased } panX += (targetX - panX) * .13; zoom += (targetZoom - zoom) * .12; camera.zoom = zoom; camera.updateProjectionMatrix(); camera.position.set(Math.cos(yaw) * 36 + panX, 30, Math.sin(yaw) * 36); camera.lookAt(panX, .7, 0); renderer.render(scene, camera) }; animate()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move); host.removeEventListener('pointerup', up); host.removeEventListener('pointercancel', up); host.removeEventListener('wheel', wheel); renderer.dispose(); host.removeChild(renderer.domElement) }
  }, [config, rival])
  return <section className="ruby-battle-map" aria-label={`${rival} battle map`}><div ref={mountRef} className="ruby-battle-canvas" /><header><span>{rival.toUpperCase()}’S DOMAIN</span><b>{config.realm}</b></header><button className="ruby-retreat" onClick={onBack}>‹ <span>RETREAT</span></button><div className="ruby-turn-indicator">YOUR TURN</div><aside className="ruby-ruler-thought" aria-label={`${rival} is thinking`}><b>THINKING</b><figure><img src={config.portrait} alt={rival} /></figure></aside><aside className={`ruby-chat${chatOpen ? '' : ' closed'}`}><button className="ruby-chat-title" onClick={() => setChatOpen(!chatOpen)}>FIELD CHAT <span>{chatOpen ? '−' : '+'}</span></button>{chatOpen && <><div className="ruby-chat-log"><p><b>SCOUT:</b> {rival}'s forces are ahead.</p><p><b>YOU:</b> Keep the line moving.</p></div><div className="ruby-chat-quick"><button>Rally here</button><button>Need support</button></div></>}</aside><aside className="ruby-commands"><p>BATTLE COMMANDS</p><b>YOUR KINGDOM</b><small>3 squads ready · 2 actions</small><div><button>⚔<em>MARCH</em></button><button>◈<em>SCOUT</em></button><button>♜<em>FORTIFY</em></button><button>✦<em>RALLY</em></button></div><button className="ruby-end-turn">END TURN ›</button></aside></section>
}
