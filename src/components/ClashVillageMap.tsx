import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const makeMaterial = (color: number, roughness = .8) => new THREE.MeshStandardMaterial({ color, roughness })

export const ClashVillageMap = () => {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = mountRef.current
    if (!host) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x78d6ed)
    scene.fog = new THREE.Fog(0x78d6ed, 34, 78)
    const camera = new THREE.OrthographicCamera(-20, 20, 12, -12, .1, 100)
    camera.position.set(22, 28, 26)
    camera.lookAt(0, 0, 0)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    host.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xeafcff, 0x47782e, 2.2))
    const sun = new THREE.DirectionalLight(0xfff0bb, 3.4)
    sun.position.set(-18, 26, 15); sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.left = -27; sun.shadow.camera.right = 27; sun.shadow.camera.top = 27; sun.shadow.camera.bottom = -27
    scene.add(sun)

    // A continuous countryside plane makes this a real kingdom, not a floating island.
    const island = new THREE.Group(); scene.add(island)
    const countryside = new THREE.Mesh(new THREE.PlaneGeometry(130, 100), makeMaterial(0x75bd43))
    countryside.rotation.x = -Math.PI / 2; countryside.position.y = -.04; countryside.receiveShadow = true; island.add(countryside)
    const meadow = new THREE.Mesh(new THREE.CircleGeometry(26, 48), makeMaterial(0x8bd04a))
    meadow.rotation.x = -Math.PI / 2; meadow.scale.z = .76; meadow.position.y = .01; meadow.receiveShadow = true; island.add(meadow)
    const fieldMat = makeMaterial(0xa5d35b)
    ;[[-19, -8, 8, 5], [18, 8, 9, 5], [-15, 12, 7, 4]].forEach(([x,z,w,d]) => {
      const field = new THREE.Mesh(new THREE.PlaneGeometry(w, d), fieldMat); field.rotation.x = -Math.PI / 2; field.position.set(x, .03, z); island.add(field)
    })
    const pathMat = makeMaterial(0xe8c372)
    const ring = new THREE.Mesh(new THREE.RingGeometry(4.2, 5.3, 36), pathMat); ring.rotation.x = -Math.PI / 2; ring.position.y = .36; island.add(ring)
    const addPath = (x1:number, z1:number, x2:number, z2:number, width = 1.1) => {
      const length = Math.hypot(x2 - x1, z2 - z1)
      const path = new THREE.Mesh(new THREE.BoxGeometry(width, .08, length), pathMat)
      path.position.set((x1+x2)/2, .08, (z1+z2)/2); path.rotation.y = Math.atan2(x2-x1, z2-z1); island.add(path)
    }
    addPath(0, -4.6, 0, -13); addPath(4.8, 0, 12, 0); addPath(-4.8, 0, -12, 1); addPath(0, 4.6, -1, 11)
    addPath(-12, 1, -15, 6, .8); addPath(12, 0, 15, -5, .8); addPath(-1, 11, 7, 13, .8)

    const addBox = (width:number, height:number, depth:number, color:number, x:number, z:number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), makeMaterial(color))
      mesh.position.set(x, height / 2 + .38, z); mesh.castShadow = true; mesh.receiveShadow = true; island.add(mesh); return mesh
    }
    const addCone = (radius:number, height:number, color:number, x:number, z:number) => {
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 4), makeMaterial(color, .7))
      mesh.position.set(x, height / 2 + .38, z); mesh.rotation.y = Math.PI / 4; mesh.castShadow = true; island.add(mesh); return mesh
    }

    // The one singular castle is the focal point of the entire settlement.
    addBox(5.2, 3.8, 4.7, 0xd9d3ba, 0, 0); addCone(3.9, 3.1, 0x485c80, 0, 0)
    addBox(.92, 1.8, .16, 0x624333, 0, -2.41)
    ;[[-2.2,-1.9],[2.2,-1.9],[-2.2,1.9],[2.2,1.9]].forEach(([x,z]) => { addBox(.75,5,.75,0xb8b4a7,x,z); addCone(.74,1.5,0x5c7094,x,z) })
    const pole = addBox(.1, 4, .1, 0x835a30, 0, 0); pole.position.y = 5
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .86), new THREE.MeshBasicMaterial({ color: 0xffcf3e, side: THREE.DoubleSide }))
    flag.position.set(.92, 6.35, 0); flag.rotation.y = Math.PI / 2; island.add(flag)

    const addHouse = (x:number, z:number, tone:number, roofColor:number, scale=.9) => {
      addBox(2.05*scale, 1.9*scale, 1.7*scale, tone, x, z); addCone(1.75*scale, 1.45*scale, roofColor, x, z)
      addBox(.4*scale, .8*scale, .09, 0x704832, x, z - .9*scale)
    }
    // Three small residential neighborhoods connected by the village paths.
    ;[[-15,5,.88],[-13,7,.76],[-16,8,.78], [14,-5,.9],[16,-3,.75],[13,-7,.78], [6,13,.8],[9,13,.9],[7,15,.72]].forEach(([x,z,s], index) => addHouse(x,z,index%2?0xe0bd78:0xd8a76a,index%3?0xc85b43:0x627492,s))

    const addStorage = (x:number, z:number, liquid:number) => {
      const group = new THREE.Group(); group.position.set(x, .38, z); island.add(group)
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.26, 1.48, 1.7, 12), makeMaterial(0x9d6a3d))
      body.position.y = .85; body.castShadow = true; group.add(body)
      const fill = new THREE.Mesh(new THREE.SphereGeometry(1.06, 16, 10), makeMaterial(liquid, .35))
      fill.scale.y = .55; fill.position.y = 1.62; group.add(fill)
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.15, .12, 8, 16), makeMaterial(0x4a342a)); rim.position.y = 1.55; rim.rotation.x = Math.PI / 2; group.add(rim)
    }
    addStorage(-7.2, -4.4, 0xffd138); addStorage(7, -4.3, 0xe568d3); addStorage(7, 5.6, 0x6bc9ed)

    const addCannon = (x:number, z:number, rotation:number) => {
      const group = new THREE.Group(); group.position.set(x, .38, z); group.rotation.y = rotation; island.add(group)
      const base = new THREE.Mesh(new THREE.CylinderGeometry(.76, .96, .5, 12), makeMaterial(0x8a9497)); base.castShadow = true; group.add(base)
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.25, .34, 1.75, 10), makeMaterial(0x3c4c53, .4)); barrel.rotation.z = Math.PI / 2; barrel.position.set(.72, .54, 0); barrel.castShadow = true; group.add(barrel)
    }
    addCannon(-10, 4.7, .3); addCannon(9, 4.4, 2.8); addCannon(-8.8, -7, -.6)
    const addTower = (x:number,z:number) => { addBox(1.3,3.55,1.3,0x92999d,x,z); addCone(1.2,1.55,0x536776,x,z) }
    addTower(-10, -.1); addTower(10, -.5); addTower(-1, 8.6)
    const addTree = (x:number,z:number,scale=.85) => {
      const group = new THREE.Group(); group.position.set(x,.4,z); group.scale.setScalar(scale); island.add(group)
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.16,.25,1.25,7),makeMaterial(0x704929)); trunk.position.y=.62; trunk.castShadow=true;group.add(trunk)
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(.92,2.45,8),makeMaterial(0x4f932f)); leaves.position.y=1.85;leaves.castShadow=true;group.add(leaves)
    }
    ;[[-19,-5,1],[-18,10,.9],[-7,15,.85],[2,18,.75],[19,4,.9],[20,-8,.8],[-6,-15,.75],[4,-16,.9],[-20,-13,.9],[18,14,.9]].forEach(([x,z,s])=>addTree(x,z,s))
    for (let i=0;i<58;i++) { const angle=i*2.4, radius=17+(i%4)*2.3; const bush=new THREE.Mesh(new THREE.DodecahedronGeometry(.28+(i%4)*.05),makeMaterial(i%4?0x5ca639:0xf0d34d)); bush.position.set(Math.cos(angle)*radius,.24,Math.sin(angle)*radius*.74);bush.castShadow=true;island.add(bush) }

    // Small roaming sheep and deer keep the fields alive.
    const animals: { group: THREE.Group; cx: number; cz: number; radius: number; phase: number; speed: number }[] = []
    const addAnimal = (cx:number, cz:number, type:'sheep'|'deer', phase:number) => {
      const group = new THREE.Group(); island.add(group)
      const body = new THREE.Mesh(new THREE.SphereGeometry(type === 'sheep' ? .44 : .36, 10, 8), makeMaterial(type === 'sheep' ? 0xf4ecd9 : 0x9b6740))
      body.scale.set(1.25,.82,.82); body.position.y=.55; body.castShadow=true;group.add(body)
      const head = new THREE.Mesh(new THREE.SphereGeometry(.2, 8, 6), makeMaterial(type === 'sheep' ? 0x76513d : 0x75472e));head.position.set(.48,.62,0);group.add(head)
      for (const [x,z] of [[-.23,-.22],[-.23,.22],[.22,-.22],[.22,.22]]) { const leg=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,.38,5),makeMaterial(0x50352a));leg.position.set(x,.2,z);group.add(leg) }
      animals.push({ group, cx, cz, radius: 1.1 + (phase % 3) * .28, phase, speed: type === 'sheep' ? .45 : .62 })
    }
    addAnimal(-13,-9,'sheep',0); addAnimal(-13,-9,'sheep',2.1); addAnimal(12,9,'deer',.9); addAnimal(12,9,'deer',3.4)

    const resize = () => { const { width, height } = host.getBoundingClientRect(); renderer.setSize(width, height, false); const aspect = width / height; camera.left = -20 * aspect; camera.right = 20 * aspect; camera.top = 12; camera.bottom = -12; camera.updateProjectionMatrix() }
    resize(); window.addEventListener('resize', resize)
    let pointerX = 0, pointerY = 0, frame = 0
    const move = (event:PointerEvent) => { pointerX = event.clientX / window.innerWidth - .5; pointerY = event.clientY / window.innerHeight - .5 }
    host.addEventListener('pointermove', move)
    const animate = () => { frame = requestAnimationFrame(animate); const time = performance.now() * .001; island.rotation.y = Math.sin(time * .16) * .012 + pointerX * .035; camera.position.x = 22 + pointerX * 2.2; camera.position.y = 28 - pointerY * 1.2; camera.lookAt(0,0,0); flag.rotation.z = Math.sin(time * 2.3) * .08; animals.forEach((animal) => { const a = time * animal.speed + animal.phase; animal.group.position.set(animal.cx + Math.cos(a)*animal.radius, .02, animal.cz + Math.sin(a)*animal.radius*.65); animal.group.rotation.y = -a + Math.PI/2; animal.group.position.y += Math.abs(Math.sin(a*3))* .05 }); renderer.render(scene, camera) }
    animate()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); host.removeEventListener('pointermove', move); renderer.dispose(); host.removeChild(renderer.domElement) }
  }, [])
  return <div ref={mountRef} className="clash-village-map" />
}

