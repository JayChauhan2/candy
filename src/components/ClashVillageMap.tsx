import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const makeMaterial = (color: number, roughness = .8) => new THREE.MeshStandardMaterial({ color, roughness, flatShading: true })

export const ClashVillageMap = () => {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = mountRef.current
    if (!host) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x78d6ed)
    scene.fog = new THREE.Fog(0x78d6ed, 34, 78)
    const camera = new THREE.OrthographicCamera(-24, 24, 13.5, -13.5, .1, 120)
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

    // A proper, readable low-poly castle: broad curtain wall, gatehouse, keep, and four round towers.
    const stoneLight = 0xd9d3ba, stoneMid = 0xaeb5b7, stoneDark = 0x747f87, roofBlue = 0x405b83
    const addCastleTower = (x:number, z:number, height:number) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(.98,1.1,height,10), makeMaterial(stoneMid))
      tower.position.set(x,height/2+.38,z); tower.castShadow=true;tower.receiveShadow=true;island.add(tower)
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.18,1.75,8),makeMaterial(roofBlue,.7))
      roof.position.set(x,height+1.22,z);roof.castShadow=true;island.add(roof)
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.02,.1,6,10),makeMaterial(stoneDark));rim.rotation.x=Math.PI/2;rim.position.set(x,height+.25,z);island.add(rim)
      for(let i=0;i<6;i++){const angle=i*Math.PI/3;const merlon=addBox(.34,.48,.34,stoneLight,x+Math.cos(angle)*.78,z+Math.sin(angle)*.78);merlon.position.y=height+.62}
    }
    // Foundation and curtain wall establish a convincing silhouette before the raised keep.
    addBox(7.2,1.25,6.4,stoneDark,0,0)
    addBox(6.7,1.85,.7,stoneLight,0,-2.85); addBox(6.7,1.85,.7,stoneLight,0,2.85)
    addBox(.7,1.85,5.3,stoneLight,-3.0,0); addBox(.7,1.85,5.3,stoneLight,3.0,0)
    // The gatehouse pushes forward, so the entrance is legible from the isometric view.
    addBox(3.15,2.85,1.25,stoneLight,0,-3.15)
    const gate = new THREE.Mesh(new THREE.PlaneGeometry(1.25,1.62),makeMaterial(0x5a4030));gate.position.set(0,1.2,-3.79);island.add(gate)
    const gateArch = new THREE.Mesh(new THREE.TorusGeometry(.68,.14,7,12,Math.PI), makeMaterial(stoneDark)); gateArch.rotation.z=Math.PI; gateArch.position.set(0,1.92,-3.8); island.add(gateArch)
    for(let i=-.42;i<=.42;i+=.21){const bar=addBox(.07,1.35,.06,0xb8bdba,i,-3.83);bar.position.y=1.18}
    // Tall central keep, stepped behind the wall rather than capped by one giant roof.
    addBox(4.25,4.75,3.8,stoneLight,0,.45)
    addBox(3.65,.42,3.25,stoneMid,0,4.9)
    ;[-1.6,-.8,0,.8,1.6].forEach((x) => { const merlon=addBox(.43,.52,.42,stoneMid,x,-1.44);merlon.position.y=5.14 })
    ;[-1.6,-.8,0,.8,1.6].forEach((x) => { const merlon=addBox(.43,.52,.42,stoneMid,x,2.36);merlon.position.y=5.14 })
    ;[-1.35,-.55,.55,1.35].forEach((z) => { const left=addBox(.42,.52,.43,stoneMid,-2.12,z);left.position.y=5.14;const right=addBox(.42,.52,.43,stoneMid,2.12,z);right.position.y=5.14 })
    addCastleTower(-3.05,-2.85,4.35);addCastleTower(3.05,-2.85,4.35);addCastleTower(-3.05,2.85,4.05);addCastleTower(3.05,2.85,4.05)
    // Narrow blue slit windows and gold banners add color without breaking the low-poly language.
    ;[-1.25,0,1.25].forEach((x) => { const window=addBox(.34,.88,.06,0x355270,x,-1.48);window.position.y=3.3 })
    ;[-2.16,2.16].forEach((x) => { const banner = new THREE.Mesh(new THREE.PlaneGeometry(.65,1.35), new THREE.MeshBasicMaterial({ color: 0xf0b933, side: THREE.DoubleSide })); banner.position.set(x,3.35,-3.84); island.add(banner) })
    const pole = addBox(.1, 3.8, .1, 0x835a30, 0, .45); pole.position.y = 7.05
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.0, .92), new THREE.MeshBasicMaterial({ color: 0xf0b933, side: THREE.DoubleSide }))
    flag.position.set(1,8.85,.45); flag.rotation.y = Math.PI / 2; island.add(flag)

    const addHouse = (x:number, z:number, tone:number, roofColor:number, scale=.9) => {
      // Layered eaves and chimneys make each house read as folded paper architecture.
      addBox(2.18*scale, .22*scale, 1.82*scale, 0xf0d898, x, z)
      addBox(2.05*scale, 1.9*scale, 1.7*scale, tone, x, z); addCone(1.75*scale, 1.45*scale, roofColor, x, z)
      addBox(.4*scale, .8*scale, .09, 0x704832, x, z - .9*scale)
      const chimney = addBox(.28*scale,.72*scale,.28*scale,0x9b6e50,x+.55*scale,z+.25*scale);chimney.position.y=2.55*scale+.38
    }
    // Three small residential neighborhoods connected by the village paths.
    ;[[-15,5,.88],[-13,7,.76],[-16,8,.78], [14,-5,.9],[16,-3,.75],[13,-7,.78], [6,13,.8],[9,13,.9],[7,15,.72]].forEach(([x,z,s], index) => addHouse(x,z,index%2?0xe0bd78:0xd8a76a,index%3?0xc85b43:0x627492,s))

    const addStorage = (x:number, z:number, liquid:number) => {
      const group = new THREE.Group(); group.position.set(x, .38, z); island.add(group)
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.78,.25,12),makeMaterial(0x786d60));plinth.position.y=.12;plinth.castShadow=true;group.add(plinth)
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.26, 1.48, 1.7, 12), makeMaterial(0x9d6a3d))
      body.position.y = .85; body.castShadow = true; group.add(body)
      const fill = new THREE.Mesh(new THREE.SphereGeometry(1.06, 16, 10), makeMaterial(liquid, .35))
      fill.scale.y = .55; fill.position.y = 1.62; group.add(fill)
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.15, .12, 8, 12), makeMaterial(0x4a342a)); rim.position.y = 1.55; rim.rotation.x = Math.PI / 2; group.add(rim)
      const paperBand = new THREE.Mesh(new THREE.TorusGeometry(1.36,.08,8,12),makeMaterial(0xe1b977));paperBand.rotation.x=Math.PI/2;paperBand.position.y=.98;group.add(paperBand)
      for(let i=0;i<4;i++){const brace=new THREE.Mesh(new THREE.BoxGeometry(.13,.84,.13),makeMaterial(0x684832));const a=i*Math.PI/2;brace.position.set(Math.cos(a)*1.34,.95,Math.sin(a)*1.34);brace.rotation.z=Math.cos(a)*.28;group.add(brace)}
    }
    addStorage(-7.2, -4.4, 0xffd138); addStorage(7, -4.3, 0xe568d3); addStorage(7, 5.6, 0x6bc9ed)

    // Individual blue-and-yellow landmark huts replace the generic box monuments.
    const addHut = (x:number, z:number, kind:'farm'|'forge'|'depot', scale=1) => {
      const group = new THREE.Group(); group.position.set(x,.38,z); group.scale.setScalar(scale); island.add(group)
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.48,1.66,.28,10),makeMaterial(0x8f7655));base.position.y=.14;base.castShadow=true;group.add(base)
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.22,1.42,1.9,10),makeMaterial(0xe0ba58));body.position.y=1.08;body.castShadow=true;group.add(body)
      const belt = new THREE.Mesh(new THREE.TorusGeometry(1.26,.1,7,10),makeMaterial(0x3e6fa5));belt.rotation.x=Math.PI/2;belt.position.y=1.23;group.add(belt)
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.76,2.15,8),makeMaterial(0x396eaa));roof.position.y=2.98;roof.rotation.y=Math.PI/8;roof.castShadow=true;group.add(roof)
      const roofBand = new THREE.Mesh(new THREE.TorusGeometry(1.32,.11,7,10),makeMaterial(0xf1ca50));roofBand.rotation.x=Math.PI/2;roofBand.position.y=2.05;group.add(roofBand)
      const door = new THREE.Mesh(new THREE.PlaneGeometry(.56,.94),makeMaterial(0x65452e));door.position.set(0,.86,-1.43);group.add(door)
      ;[-.55,.55].forEach((side)=>{const window=new THREE.Mesh(new THREE.CircleGeometry(.18,7),makeMaterial(0x467eb7));window.position.set(side,1.25,-1.3);group.add(window)})
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(.18,.24,.85,6),makeMaterial(0x8b6349));chimney.position.set(.58,3.28,.18);chimney.castShadow=true;group.add(chimney)
      if (kind === 'farm') {
        for (let row=0;row<3;row++) for(let col=0;col<3;col++){const crop=new THREE.Mesh(new THREE.ConeGeometry(.09,.52,5),makeMaterial(0xd9b83c));crop.position.set(-2.2+col*.43,.27,-.55+row*.42);group.add(crop)}
        ;[[-1.85,-1.35],[-1.45,-1.2]].forEach(([bx,bz])=>{const bale=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.46,8),makeMaterial(0xe5c55d));bale.rotation.z=Math.PI/2;bale.position.set(bx,.48,bz);group.add(bale)})
      }
      if (kind === 'forge') {
        const anvil = new THREE.Mesh(new THREE.CylinderGeometry(.36,.22,.68,6),makeMaterial(0x48525a));anvil.position.set(-1.55,.66,-.5);group.add(anvil)
        const fire = new THREE.Mesh(new THREE.ConeGeometry(.28,.65,6),makeMaterial(0xf29b35,.45));fire.position.set(-1.55,.74,-.5);group.add(fire)
        ;[0,1,2].forEach((i)=>{const smoke=new THREE.Mesh(new THREE.DodecahedronGeometry(.15+i*.05),makeMaterial(0xd8e5e5));smoke.position.set(.58,4.05+i*.3,.18);group.add(smoke)})
      }
      if (kind === 'depot') {
        ;[[-1.35,-.8],[-1.0,-.82],[-1.15,-.45]].forEach(([cx,cz])=>{const crate=new THREE.Mesh(new THREE.BoxGeometry(.38,.38,.38),makeMaterial(0x94613a));crate.position.set(cx,.38,cz);crate.rotation.y=.3;group.add(crate)})
        const depotFlag=new THREE.Mesh(new THREE.PlaneGeometry(.74,.48),new THREE.MeshBasicMaterial({color:0x386ba3,side:THREE.DoubleSide}));depotFlag.position.set(-.94,2.95,.05);depotFlag.rotation.y=Math.PI/2;group.add(depotFlag)
      }
    }
    const windmillRotors: THREE.Group[] = []
    const addWindmill = (x:number,z:number) => {
      const group=new THREE.Group();group.position.set(x,.38,z);island.add(group)
      const base=new THREE.Mesh(new THREE.CylinderGeometry(1.65,2.05,.34,10),makeMaterial(0x8d7658));base.position.y=.17;group.add(base)
      const body=new THREE.Mesh(new THREE.CylinderGeometry(.88,1.38,4.3,8),makeMaterial(0xe0ba58));body.position.y=2.32;body.castShadow=true;group.add(body)
      const roof=new THREE.Mesh(new THREE.ConeGeometry(1.38,1.75,8),makeMaterial(0x386ba3));roof.position.y=5.35;roof.castShadow=true;group.add(roof)
      const door=new THREE.Mesh(new THREE.PlaneGeometry(.48,.95),makeMaterial(0x65452e));door.position.set(0,.88,-1.4);group.add(door)
      const rotor=new THREE.Group();rotor.position.set(0,3.72,-.98);group.add(rotor);windmillRotors.push(rotor)
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.24,8),makeMaterial(0x7a563d));hub.rotation.x=Math.PI/2;rotor.add(hub)
      for(let i=0;i<4;i++){const angle=i*Math.PI/2;const blade=new THREE.Mesh(new THREE.BoxGeometry(.34,1.8,.08),makeMaterial(i%2?0xf1ca50:0x4d80b8));blade.position.set(Math.sin(angle)*.74,Math.cos(angle)*.74,0);blade.rotation.z=-angle;rotor.add(blade)}
    }
    addHut(-10,4.7,'farm',1.05); addHut(9,4.4,'forge',.98); addHut(-8.8,-7,'depot',.95); addWindmill(15,8)
    const addTree = (x:number,z:number,scale=.85) => {
      const group = new THREE.Group(); group.position.set(x,.4,z); group.scale.setScalar(scale); island.add(group)
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.16,.25,1.25,7),makeMaterial(0x704929)); trunk.position.y=.62; trunk.castShadow=true;group.add(trunk)
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(.92,2.45,8),makeMaterial(0x4f932f)); leaves.position.y=1.85;leaves.castShadow=true;group.add(leaves)
    }
    ;[[-19,-5,1],[-18,10,.9],[-7,15,.85],[2,18,.75],[19,4,.9],[20,-8,.8],[-6,-15,.75],[4,-16,.9],[-20,-13,.9],[18,14,.9]].forEach(([x,z,s])=>addTree(x,z,s))
    for (let i=0;i<58;i++) { const angle=i*2.4, radius=17+(i%4)*2.3; const bush=new THREE.Mesh(new THREE.DodecahedronGeometry(.28+(i%4)*.05),makeMaterial(i%4?0x5ca639:0xf0d34d)); bush.position.set(Math.cos(angle)*radius,.24,Math.sin(angle)*radius*.74);bush.castShadow=true;island.add(bush) }

    // Small roaming sheep and deer keep the fields alive.
    const animals: { group: THREE.Group; legs: THREE.Mesh[]; cx: number; cz: number; radius: number; phase: number; speed: number }[] = []
    const addAnimal = (cx:number, cz:number, type:'sheep'|'deer', phase:number) => {
      const group = new THREE.Group(); island.add(group)
      const body = new THREE.Mesh(new THREE.SphereGeometry(type === 'sheep' ? .44 : .36, 10, 8), makeMaterial(type === 'sheep' ? 0xf4ecd9 : 0x9b6740))
      body.scale.set(1.25,.82,.82); body.position.y=.55; body.castShadow=true;group.add(body)
      const head = new THREE.Mesh(new THREE.SphereGeometry(.2, 8, 6), makeMaterial(type === 'sheep' ? 0x76513d : 0x75472e));head.position.set(.48,.62,0);group.add(head)
      const legs: THREE.Mesh[] = []
      for (const [x,z] of [[-.23,-.22],[-.23,.22],[.22,-.22],[.22,.22]]) { const leg=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,.38,5),makeMaterial(0x50352a));leg.position.set(x,.2,z);group.add(leg);legs.push(leg) }
      animals.push({ group, legs, cx, cz, radius: 1.1 + (phase % 3) * .28, phase, speed: type === 'sheep' ? .45 : .62 })
    }
    addAnimal(-13,-9,'sheep',0); addAnimal(-13,-9,'sheep',2.1); addAnimal(12,9,'deer',.9); addAnimal(12,9,'deer',3.4)

    // A few simple low-poly birds cross the open sky, flapping independently.
    const birds: { group: THREE.Group; phase: number; speed: number; startX: number; startZ: number; altitude: number }[] = []
    const addBird = (startX:number, startZ:number, phase:number) => {
      const altitude = 10 + (phase % 3) * 1.25
      const group = new THREE.Group(); group.position.set(startX, altitude, startZ); scene.add(group)
      const wingMat = new THREE.MeshBasicMaterial({ color: 0x34445a, side: THREE.DoubleSide })
      const left = new THREE.Mesh(new THREE.PlaneGeometry(.72,.26),wingMat); left.position.x=-.34; left.rotation.z=.34;group.add(left)
      const right = new THREE.Mesh(new THREE.PlaneGeometry(.72,.26),wingMat); right.position.x=.34; right.rotation.z=-.34;group.add(right)
      birds.push({ group, phase, speed: .045 + (phase%3)*.009, startX, startZ, altitude })
    }
    addBird(-23,-10,0); addBird(-18,-13,1.4); addBird(-25,-6,2.8); addBird(-20,-3,4.1)

    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      const aspect = width / height
      const halfHeight = 13.5
      // Matching the horizontal and vertical world-unit scale prevents the old tall/stretchy look.
      camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect
      camera.top = halfHeight; camera.bottom = -halfHeight
      renderer.setSize(width, height, false)
      camera.updateProjectionMatrix()
    }
    resize(); window.addEventListener('resize', resize)
    let pointerX = 0, pointerY = 0, lookX = 0, lookZ = 0, frame = 0
    const move = (event:PointerEvent) => { const rect=host.getBoundingClientRect(); pointerX = (event.clientX-rect.left) / rect.width - .5; pointerY = (event.clientY-rect.top) / rect.height - .5 }
    host.addEventListener('pointermove', move)
    const animate = () => { frame = requestAnimationFrame(animate); const time = performance.now() * .001; lookX += (-pointerX*10-lookX)*.055; lookZ += (-pointerY*7-lookZ)*.055; island.rotation.y = Math.sin(time * .16) * .008 + pointerX * .02; camera.position.x = 22 + pointerX * 12; camera.position.z = 26 - pointerX * 9; camera.position.y = 28 - pointerY * 4; camera.lookAt(lookX,0,lookZ); flag.rotation.z = Math.sin(time * 2.3) * .08; animals.forEach((animal) => { const a = time * animal.speed + animal.phase, dx = -Math.sin(a), dz = Math.cos(a)*.65; animal.group.position.set(animal.cx + Math.cos(a)*animal.radius, .02 + Math.abs(Math.sin(a*3))* .05, animal.cz + Math.sin(a)*animal.radius*.65); animal.group.rotation.y = Math.atan2(-dz, dx); animal.legs.forEach((leg,index) => { leg.rotation.z = Math.sin(a*8 + (index%2)*Math.PI)*.52 }) }); windmillRotors.forEach((rotor,index)=>{rotor.rotation.z=time*(.75+index*.15)}); birds.forEach((bird) => { const travel = ((time*bird.speed + bird.phase) % 1); bird.group.position.x = bird.startX + travel*54; bird.group.position.y = bird.altitude + Math.sin(time*1.1+bird.phase)*.22; bird.group.position.z = bird.startZ + Math.sin(time*.32+bird.phase)*2.1; bird.group.children.forEach((wing,index) => { wing.rotation.z = (index ? -1 : 1) * (.28 + Math.sin(time*4.1+bird.phase)*.38) }) }); renderer.render(scene, camera) }
    animate()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); host.removeEventListener('pointermove', move); renderer.dispose(); host.removeChild(renderer.domElement) }
  }, [])
  return <div ref={mountRef} className="clash-village-map" />
}
