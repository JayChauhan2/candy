import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const makeMaterial = (color: number, roughness = .8) => new THREE.MeshStandardMaterial({ color, roughness, flatShading: true })

export const ClashVillageMap = () => {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = mountRef.current
    if (!host) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xa8c4c0)
    scene.fog = new THREE.Fog(0xa8c4c0, 34, 78)
    const camera = new THREE.OrthographicCamera(-24, 24, 13.5, -13.5, .1, 120)
    camera.position.set(22, 28, 26)
    camera.lookAt(0, 0, 0)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    host.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xf3f1e8, 0x557750, 2.1))
    const sun = new THREE.DirectionalLight(0xfff4d4, 2.7)
    sun.position.set(-18, 26, 15); sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.left = -27; sun.shadow.camera.right = 27; sun.shadow.camera.top = 27; sun.shadow.camera.bottom = -27
    scene.add(sun)

    // A continuous countryside plane makes this a real kingdom, not a floating island.
    const island = new THREE.Group(); scene.add(island)
    const countryside = new THREE.Mesh(new THREE.PlaneGeometry(130, 100), makeMaterial(0x7fab7b))
    countryside.rotation.x = -Math.PI / 2; countryside.position.y = -.04; countryside.receiveShadow = true; island.add(countryside)
    const meadow = new THREE.Mesh(new THREE.CircleGeometry(26, 48), makeMaterial(0x91b989))
    meadow.rotation.x = -Math.PI / 2; meadow.scale.z = .76; meadow.position.y = .01; meadow.receiveShadow = true; island.add(meadow)
    const fieldMat = makeMaterial(0xa2b886)
    ;[[-19, -8, 8, 5], [18, 8, 9, 5], [-15, 12, 7, 4]].forEach(([x,z,w,d]) => {
      const field = new THREE.Mesh(new THREE.PlaneGeometry(w, d), fieldMat); field.rotation.x = -Math.PI / 2; field.position.set(x, .03, z); island.add(field)
    })
    const pathMat = makeMaterial(0xd4d0bf)
    // A full round plaza hides path joins and makes every route flow cleanly into the castle.
    const ring = new THREE.Mesh(new THREE.CircleGeometry(5.7, 40), pathMat); ring.rotation.x = -Math.PI / 2; ring.position.y = .07; ring.receiveShadow = true; island.add(ring)
    const addPath = (x1:number, z1:number, x2:number, z2:number, width = 1.1) => {
      const dx=x2-x1, dz=z2-z1, distance=Math.hypot(dx,dz), seed=Math.sin(x1*7.7+z1*3.1+x2*5.3+z2*2.7)
      const bend=(.45+Math.abs(seed)*.6)*Math.min(2.4,distance*.14)
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x1,.06,z1),
        new THREE.Vector3(x1+dx*.3-dz/distance*bend,.06,z1+dz*.3+dx/distance*bend),
        new THREE.Vector3(x1+dx*.7+dz/distance*bend*.62,.06,z1+dz*.7-dx/distance*bend*.62),
        new THREE.Vector3(x2,.06,z2)
      ])
      // A flat, uneven ribbon gives the route naturally worn edges instead of a geometric tube.
      const left: THREE.Vector2[] = [], right: THREE.Vector2[] = []
      for(let i=0;i<=28;i++){
        const t=i/28, point=curve.getPoint(t), tangent=curve.getTangent(t).normalize()
        const uneven=width*.5*(.84+Math.sin(i*2.41+seed*9)*.12+Math.sin(i*.77-seed)*.05)
        left.push(new THREE.Vector2(point.x-tangent.z*uneven,-(point.z+tangent.x*uneven)))
        right.push(new THREE.Vector2(point.x+tangent.z*uneven,-(point.z-tangent.x*uneven)))
      }
      const outline=new THREE.Shape();outline.moveTo(left[0].x,left[0].y);left.slice(1).forEach(p=>outline.lineTo(p.x,p.y));right.reverse().forEach(p=>outline.lineTo(p.x,p.y));outline.closePath()
      const pathGeo=new THREE.ShapeGeometry(outline,1);pathGeo.rotateX(-Math.PI/2)
      const path = new THREE.Mesh(pathGeo,pathMat);path.position.y=.075;path.receiveShadow=true;island.add(path)
      // Sparse, subdued tufts are only placed around the path edges to blend path and meadow.
      for(let i=2;i<12;i+=3){
        const t=i/12, point=curve.getPoint(t), tangent=curve.getTangent(t).normalize()
        const side=(i%2?1:-1), nx=-tangent.z*side, nz=tangent.x*side
        const tuft=new THREE.Group();tuft.position.set(point.x+nx*(width*.62),.12,point.z+nz*(width*.62));tuft.rotation.y=i*1.71;island.add(tuft)
        const bladeCount=2+(i%4)
        for(let blade=0;blade<bladeCount;blade++){
          const height=.18+((i+blade*3)%5)*.055, spread=(blade-(bladeCount-1)/2)*.09
          const grass=new THREE.Mesh(new THREE.ConeGeometry(.025+(blade%2)*.015,height,3),makeMaterial(0x91b989))
          grass.position.set(spread,height/2,(blade%3-.8)*.045);grass.rotation.z=spread*1.8;tuft.add(grass)
        }
      }
    }
    addPath(0, -4.6, 0, -13); addPath(4.8, 0, 12, 0); addPath(-4.8, 0, -12, 1); addPath(0, 4.6, -1, 11)
    addPath(-12, 1, -15, 6, .8); addPath(12, 0, 15, -5, .8); addPath(-1, 11, 7, 13, .8)
    addPath(12,0,8,-10,.8); addPath(-12,1,-10,-8,.8); addPath(0,-13,7,-11,.85)
    addPath(0,4.9,0,31,2.25)

    const addBox = (width:number, height:number, depth:number, color:number, x:number, z:number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), makeMaterial(color))
      mesh.position.set(x, height / 2 + .38, z); mesh.castShadow = true; mesh.receiveShadow = true; island.add(mesh); return mesh
    }
    const addCone = (radius:number, height:number, color:number, x:number, z:number) => {
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 4), makeMaterial(color, .7))
      mesh.position.set(x, height / 2 + .38, z); mesh.rotation.y = Math.PI / 4; mesh.castShadow = true; island.add(mesh); return mesh
    }

    // A proper, readable low-poly castle: broad curtain wall, gatehouse, keep, and four round towers.
    const stoneLight = 0xc7bdaa, stoneMid = 0xa89f91, stoneDark = 0x777a74, roofBlue = 0x718ba0
    const addCastleTower = (x:number, z:number, height:number) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(.98,1.1,height,10), makeMaterial(stoneMid))
      tower.position.set(x,height/2+.38,z); tower.castShadow=true;tower.receiveShadow=true;island.add(tower)
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.18,1.75,8),makeMaterial(roofBlue,.7))
      roof.position.set(x,height+1.22,z);roof.castShadow=true;island.add(roof)
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.02,.1,6,10),makeMaterial(stoneDark));rim.rotation.x=Math.PI/2;rim.position.set(x,height+.25,z);island.add(rim)
      for(let i=0;i<6;i++){const angle=i*Math.PI/3;const merlon=addBox(.34,.48,.34,stoneLight,x+Math.cos(angle)*.78,z+Math.sin(angle)*.78);merlon.position.y=height+.62}
    }
    // Foundation and curtain wall establish a convincing silhouette before the raised keep.
    const castleFooting = new THREE.Mesh(new THREE.CylinderGeometry(4.55,4.8,1.05,8),makeMaterial(stoneDark));castleFooting.position.y=.53;castleFooting.castShadow=true;castleFooting.receiveShadow=true;island.add(castleFooting)
    addBox(6.7,1.85,.7,stoneLight,0,-2.85)
    addBox(.7,1.85,5.3,stoneLight,-3.0,0); addBox(.7,1.85,5.3,stoneLight,3.0,0)
    // Keep the road clear: the gate is only implied by the curtain-wall opening, with no projecting slab.
    // Tall central keep, stepped behind the wall rather than capped by one giant roof.
    addBox(4.25,4.75,3.8,stoneLight,0,.45)
    addBox(3.65,.42,3.25,stoneMid,0,4.9)
    ;[-1.6,-.8,0,.8,1.6].forEach((x) => { const merlon=addBox(.43,.52,.42,stoneMid,x,-1.44);merlon.position.y=5.14 })
    ;[-1.6,-.8,0,.8,1.6].forEach((x) => { const merlon=addBox(.43,.52,.42,stoneMid,x,2.36);merlon.position.y=5.14 })
    ;[-1.35,-.55,.55,1.35].forEach((z) => { const left=addBox(.42,.52,.43,stoneMid,-2.12,z);left.position.y=5.14;const right=addBox(.42,.52,.43,stoneMid,2.12,z);right.position.y=5.14 })
    addCastleTower(-3.05,-2.85,4.35);addCastleTower(3.05,-2.85,4.35);addCastleTower(-3.05,2.85,4.05);addCastleTower(3.05,2.85,4.05)
    // Narrow blue slit windows and gold banners add color without breaking the low-poly language.
    ;[-1.25,0,1.25].forEach((x) => { const window=addBox(.34,.88,.06,0x577f9b,x,2.4);window.position.y=3.3 })
    ;[-.8,.8].forEach((z) => { const window=addBox(.06,.72,.32,0x577f9b,2.16,z);window.position.y=3.35 })
    ;[-2.16,2.16].forEach((x) => { const banner = new THREE.Mesh(new THREE.PlaneGeometry(.65,1.35), new THREE.MeshBasicMaterial({ color: 0xd1a650, side: THREE.DoubleSide })); banner.position.set(x,3.35,3.84); banner.rotation.y=Math.PI;island.add(banner) })
    const pole = addBox(.1, 3.8, .1, 0x835a30, 0, .45); pole.position.y = 7.05
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.0, .92), new THREE.MeshBasicMaterial({ color: 0xf0b933, side: THREE.DoubleSide }))
    // The flag's inner edge starts at the pole instead of floating beside it.
    flag.position.set(1,8.85,.45); island.add(flag)

    const addHouse = (x:number, z:number, tone:number, roofColor:number, scale=.9) => {
      // These are the residential cottages lining the paths, with a round paper-cut silhouette.
      const home = new THREE.Group(); home.position.set(x,.38,z); home.scale.setScalar(scale); island.add(home)
      const foundation = new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.48,.26,8),makeMaterial(0x8a7050));foundation.position.y=.13;home.add(foundation)
      const walls = new THREE.Mesh(new THREE.CylinderGeometry(1.16,1.28,1.78,8),makeMaterial(tone));walls.position.y=1.02;walls.castShadow=true;home.add(walls)
      const eave = new THREE.Mesh(new THREE.TorusGeometry(1.22,.1,7,8),makeMaterial(0xf0d898));eave.rotation.x=Math.PI/2;eave.position.y=1.82;home.add(eave)
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.62,1.8,7),makeMaterial(roofColor));roof.position.y=2.8;roof.rotation.y=Math.PI/7;roof.castShadow=true;home.add(roof)
      const door = new THREE.Mesh(new THREE.PlaneGeometry(.5,.9),makeMaterial(0x6a472f));door.position.set(0,.78,1.3);door.rotation.y=Math.PI;home.add(door)
      ;[-.48,.48].forEach((side)=>{const frontWindow=new THREE.Mesh(new THREE.CircleGeometry(.15,7),makeMaterial(0x6f98ad));frontWindow.position.set(side,1.22,1.18);frontWindow.rotation.y=Math.PI;home.add(frontWindow);const sideWindow=new THREE.Mesh(new THREE.CircleGeometry(.15,7),makeMaterial(0x6f98ad));sideWindow.position.set(1.18,1.22,side);sideWindow.rotation.y=Math.PI/2;home.add(sideWindow)})
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(.16,.21,.68,6),makeMaterial(0x956952));chimney.position.set(.5,3.15,.08);home.add(chimney)
    }
    // Three small residential neighborhoods connected by the village paths.
    // Neighborhoods are deliberately spaced into west, east, rear, and entrance districts.
    ;[[-15,5,.88],[-13,7,.76],[-16,8,.78],[-14,-7,.82],[-16,-10,.76],
      [14,-5,.9],[16,-3,.75],[18,-8,.78],
      [-5,-14,.8],[-1,-16,.9],[4,-16,.72],
      [15,12,.8],[18,14,.76]].forEach(([x,z,s], index) => addHouse(x,z,index%2?0xe0bd78:0xd8a76a,index%3?0xc85b43:0x627492,s))

    // Open-front stable beside the castle's main exit, with two visible horses in their stalls.
    const addHorseShed = (x:number,z:number) => {
      const shed=new THREE.Group();shed.position.set(x,.38,z);island.add(shed)
      const floor=new THREE.Mesh(new THREE.BoxGeometry(3.35,.18,2.65),makeMaterial(0x9b7b58));floor.position.y=.09;floor.receiveShadow=true;shed.add(floor)
      const back=new THREE.Mesh(new THREE.BoxGeometry(3.2,2.2,.18),makeMaterial(0xb18d63));back.position.set(0,1.2,-1.2);back.castShadow=true;shed.add(back)
      ;[[-1.42,-1.08], [1.42,-1.08], [-1.42,1.08], [1.42,1.08]].forEach(([px,pz])=>{const post=new THREE.Mesh(new THREE.CylinderGeometry(.11,.14,2.65,6),makeMaterial(0x72513a));post.position.set(px,1.33,pz);post.castShadow=true;shed.add(post)})
      const roof=new THREE.Mesh(new THREE.ConeGeometry(2.5,1.5,4),makeMaterial(0x6f8fa0));roof.position.y=3.12;roof.rotation.y=Math.PI/4;roof.castShadow=true;shed.add(roof)
      const makeHorse = (hx:number) => {const horse=new THREE.Group();horse.position.set(hx,.18,.12);shed.add(horse);const body=new THREE.Mesh(new THREE.SphereGeometry(.48,8,6),makeMaterial(0x8a5d43));body.scale.set(1.35,.78,.78);body.position.y=.64;horse.add(body);const neck=new THREE.Mesh(new THREE.CylinderGeometry(.17,.23,.58,6),makeMaterial(0x8a5d43));neck.position.set(.46,.95,0);neck.rotation.z=-.45;horse.add(neck);const head=new THREE.Mesh(new THREE.SphereGeometry(.22,7,6),makeMaterial(0x744832));head.position.set(.66,1.2,0);horse.add(head);for(const [lx,lz] of [[-.28,-.22],[-.28,.22],[.3,-.22],[.3,.22]]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.045,.055,.52,5),makeMaterial(0x543729));leg.position.set(lx,.28,lz);horse.add(leg)}}
      makeHorse(-.65);makeHorse(.65)
    }
    addHorseShed(15,-14)

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
    addStorage(-7.2, -4.4, 0xffd138); addStorage(7, -4.3, 0xe568d3); addStorage(14, 2.2, 0x6bc9ed)

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
      const rotor=new THREE.Group();rotor.position.set(0,3.72,.98);group.add(rotor);windmillRotors.push(rotor)
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.24,8),makeMaterial(0x7a563d));hub.rotation.x=Math.PI/2;rotor.add(hub)
      for(let i=0;i<4;i++){const angle=i*Math.PI/2;const blade=new THREE.Mesh(new THREE.BoxGeometry(.34,1.8,.08),makeMaterial(i%2?0xf1ca50:0x4d80b8));blade.position.set(Math.sin(angle)*.74,Math.cos(angle)*.74,0);blade.rotation.z=-angle;rotor.add(blade)}
    }
    const addFarmstead = (x:number,z:number) => {
      addHut(x,z,'farm',1.18)
      const soil = new THREE.Mesh(new THREE.PlaneGeometry(5.1,3.6),makeMaterial(0x887052));soil.rotation.x=-Math.PI/2;soil.position.set(x+1.2,.08,z-4.0);island.add(soil)
      // Simple hand-built fence enclosing the crop plot.
      const railMat=makeMaterial(0x86634a)
      ;[[0,-1.8,5.2,.13],[0,1.8,5.2,.13],[-2.6,0,.13,3.7],[2.6,0,.13,3.7]].forEach(([dx,dz,w,d])=>{const rail=new THREE.Mesh(new THREE.BoxGeometry(w,.14,d),railMat);rail.position.set(x+1.2+dx,.48,z-4+dz);rail.castShadow=true;island.add(rail)})
      for(let row=0;row<4;row++)for(let col=0;col<6;col++){const crop=new THREE.Mesh(new THREE.ConeGeometry(.11,.62,5),makeMaterial((row+col)%4?0x7ea459:0xd2ba4d));crop.position.set(x-.63+col*.72,.36,z-5.1+row*.72);island.add(crop)}
    }
    addHut(-10,4.7,'farm',1.05); addHut(9,4.4,'forge',.98); addHut(-8.8,-7,'depot',.95); addFarmstead(5,-11); addWindmill(10,-13)

    // Civic landmarks make the settlement read as a lived-in, defended civilization.
    const addWatchPost = (x:number,z:number) => {
      const post=new THREE.Group();post.position.set(x,.38,z);island.add(post)
      const base=new THREE.Mesh(new THREE.CylinderGeometry(1.12,1.3,.36,8),makeMaterial(0x8e8a7d));base.position.y=.18;post.add(base)
      ;[[-.62,-.62],[.62,-.62],[-.62,.62],[.62,.62]].forEach(([px,pz])=>{const leg=new THREE.Mesh(new THREE.CylinderGeometry(.11,.15,2.65,6),makeMaterial(0x77543b));leg.position.set(px,1.65,pz);leg.castShadow=true;post.add(leg)})
      const platform=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,.19,8),makeMaterial(0x8a664a));platform.position.y=2.82;post.add(platform)
      const roof=new THREE.Mesh(new THREE.ConeGeometry(1.48,1.08,4),makeMaterial(0x6d91a1));roof.position.y=3.62;roof.rotation.y=Math.PI/4;roof.castShadow=true;post.add(roof)
      const banner=new THREE.Mesh(new THREE.PlaneGeometry(.68,.46),new THREE.MeshBasicMaterial({color:0xd4ad50,side:THREE.DoubleSide}));banner.position.set(.38,4.35,0);banner.rotation.y=Math.PI/2;post.add(banner)
    }
    const addMarket = (x:number,z:number) => {
      const market=new THREE.Group();market.position.set(x,.38,z);island.add(market)
      const table=new THREE.Mesh(new THREE.BoxGeometry(2.65,.7,1.15),makeMaterial(0x8b674b));table.position.y=.65;market.add(table)
      const canopy=new THREE.Mesh(new THREE.ConeGeometry(2.0,.62,4),makeMaterial(0x718fa3));canopy.position.y=2.52;canopy.rotation.y=Math.PI/4;market.add(canopy)
      ;[[-1.1,-.45],[1.1,-.45],[-1.1,.45],[1.1,.45]].forEach(([px,pz])=>{const pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,2.05,5),makeMaterial(0x765139));pole.position.set(px,1.3,pz);market.add(pole)})
      ;[[-.65,0],[0,.12],[.65,-.08]].forEach(([px,pz],i)=>{const basket=new THREE.Mesh(new THREE.SphereGeometry(.22,7,5),makeMaterial(i===1?0xd1a650:0x9c7449));basket.scale.y=.6;basket.position.set(px,1.14,pz);market.add(basket)})
    }
    const addTrainingYard = (x:number,z:number) => {
      const yard=new THREE.Group();yard.position.set(x,.38,z);island.add(yard)
      const dirt=new THREE.Mesh(new THREE.CircleGeometry(2.05,12),makeMaterial(0xbda978));dirt.rotation.x=-Math.PI/2;dirt.position.y=.03;yard.add(dirt)
      for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const fence=new THREE.Mesh(new THREE.BoxGeometry(.16,.65,.16),makeMaterial(0x7c583d));fence.position.set(Math.cos(a)*1.8,.33,Math.sin(a)*1.8);yard.add(fence)}
      ;[[-.48,0],[.55,.35]].forEach(([px,pz])=>{const dummy=new THREE.Group();dummy.position.set(px,.15,pz);yard.add(dummy);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,1.2,6),makeMaterial(0x765139));pole.position.y=.6;dummy.add(pole);const target=new THREE.Mesh(new THREE.SphereGeometry(.28,7,6),makeMaterial(0xd7ba73));target.position.y=1.25;dummy.add(target)})
    }
    const addSignpost = (x:number,z:number) => {const sign=new THREE.Group();sign.position.set(x,.38,z);island.add(sign);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.09,1.25,6),makeMaterial(0x755038));pole.position.y=.63;sign.add(pole);const arm=new THREE.Mesh(new THREE.BoxGeometry(.9,.25,.1),makeMaterial(0xceb16c));arm.position.set(.28,1.12,0);arm.rotation.y=.2;sign.add(arm)}
    const addLantern = (x:number,z:number) => {const post=new THREE.Group();post.position.set(x,.38,z);island.add(post);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.06,1.35,6),makeMaterial(0x5e4b3b));pole.position.y=.68;post.add(pole);const light=new THREE.Mesh(new THREE.OctahedronGeometry(.16),makeMaterial(0xf2d77b,.35));light.position.y=1.42;post.add(light)}
    addWatchPost(-5.1,20);addWatchPost(5.1,20);addWatchPost(-21,13);addWatchPost(20,-11)
    addMarket(12,11);addTrainingYard(-5.8,7.5)
    addSignpost(7.5,-3);addSignpost(-7,2);addSignpost(5,-10);addSignpost(-14,-7)
    addLantern(-2.1,6.5);addLantern(2.1,6.5);addLantern(-13,5);addLantern(-12,-8);addLantern(12,-5);addLantern(7,12)
    const addTree = (x:number,z:number,scale=.85) => {
      const group = new THREE.Group(); group.position.set(x,.4,z); group.scale.setScalar(scale); island.add(group)
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.16,.25,1.25,7),makeMaterial(0x704929)); trunk.position.y=.62; trunk.castShadow=true;group.add(trunk)
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(.92,2.45,8),makeMaterial(0x4f932f)); leaves.position.y=1.85;leaves.castShadow=true;group.add(leaves)
    }
    ;[[-19,-5,1],[-18,10,.9],[-7,15,.85],[2,18,.75],[19,4,.9],[20,-8,.8],[-6,-15,.75],[4,-16,.9],[-20,-13,.9],[18,14,.9]].forEach(([x,z,s])=>addTree(x,z,s))
    // Instanced circular forest: twelve concentric bands continue past the view, never revealing a square map edge.
    const forestBands = 12, treesPerBand = 68, forestCount = forestBands * treesPerBand
    const forestTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.16,.25,1.25,7),makeMaterial(0x704929),forestCount)
    const forestLeaves = new THREE.InstancedMesh(new THREE.ConeGeometry(.92,2.45,8),makeMaterial(0x4f932f),forestCount)
    forestTrunks.castShadow=true;forestLeaves.castShadow=true;forestTrunks.receiveShadow=true;forestLeaves.receiveShadow=true
    const treeMatrix = new THREE.Object3D()
    let forestIndex=0
    for(let band=0;band<forestBands;band++) for(let i=0;i<treesPerBand;i++){
      const seed=forestIndex*17.41, angle=(i/treesPerBand)*Math.PI*2+band*.19
      const radius=21+band*2.85+Math.sin(seed)*.78, scale=.76+((i*7+band*3)%8)*.1
      const x=Math.cos(angle)*radius*1.18, z=Math.sin(angle)*radius*.9
      // Leave a single wide woodland corridor aligned with the castle's forward exit road.
      if(z>6 && Math.abs(x)<3.3) continue
      treeMatrix.position.set(x,.4+(.62*scale),z);treeMatrix.rotation.set(0,angle+.22,0);treeMatrix.scale.setScalar(scale);treeMatrix.updateMatrix();forestTrunks.setMatrixAt(forestIndex,treeMatrix.matrix)
      treeMatrix.position.set(x,.4+(1.85*scale),z);treeMatrix.scale.setScalar(scale);treeMatrix.updateMatrix();forestLeaves.setMatrixAt(forestIndex,treeMatrix.matrix)
      forestIndex++
    }
    forestTrunks.count=forestIndex;forestLeaves.count=forestIndex;forestTrunks.instanceMatrix.needsUpdate=true;forestLeaves.instanceMatrix.needsUpdate=true;island.add(forestTrunks,forestLeaves)
    for (let i=0;i<58;i++) { const angle=i*2.4, radius=17+(i%4)*2.3; const bush=new THREE.Mesh(new THREE.DodecahedronGeometry(.28+(i%4)*.05),makeMaterial(i%5?0x71986c:0xe9e8d5)); bush.position.set(Math.cos(angle)*radius,.24,Math.sin(angle)*radius*.74);bush.castShadow=true;island.add(bush) }

    // Shared stone well at the end of the upper-right village path.
    const addWell = (x:number,z:number) => {
      const group=new THREE.Group();group.position.set(x,.38,z);island.add(group)
      const base=new THREE.Mesh(new THREE.CylinderGeometry(1.04,1.22,.38,10),makeMaterial(0x9b988c));base.position.y=.19;base.castShadow=true;group.add(base)
      const wall=new THREE.Mesh(new THREE.CylinderGeometry(.82,.98,.62,10),makeMaterial(0xb9b4a8));wall.position.y=.58;wall.castShadow=true;group.add(wall)
      const water=new THREE.Mesh(new THREE.CircleGeometry(.69,12),makeMaterial(0x86b6c5,.45));water.rotation.x=-Math.PI/2;water.position.y=.92;group.add(water)
      ;[-.74,.74].forEach((px)=>{const post=new THREE.Mesh(new THREE.BoxGeometry(.15,2.05,.15),makeMaterial(0x825f42));post.position.set(px,1.64,0);group.add(post)})
      const roof=new THREE.Mesh(new THREE.ConeGeometry(1.27,.95,4),makeMaterial(0x7a94a7));roof.position.y=2.75;roof.rotation.y=Math.PI/4;roof.castShadow=true;group.add(roof)
      const spindle=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,1.7,6),makeMaterial(0x724f35));spindle.rotation.z=Math.PI/2;spindle.position.y=1.88;group.add(spindle)
      const bucket=new THREE.Mesh(new THREE.CylinderGeometry(.14,.19,.26,7),makeMaterial(0x9b6b40));bucket.position.set(0,1.5,.14);group.add(bucket)
    }
    addWell(2.25,-12.15)

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
      birds.push({ group, phase, speed: .018 + (phase%3)*.004, startX: -65, startZ, altitude })
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
    let pointerX = 0, pointerY = 0, yaw = Math.atan2(26,22), height = 28, frame = 0
    const move = (event:PointerEvent) => { const rect=host.getBoundingClientRect(); pointerX = (event.clientX-rect.left) / rect.width - .5; pointerY = (event.clientY-rect.top) / rect.height - .5 }
    host.addEventListener('pointermove', move)
    const animate = () => { frame = requestAnimationFrame(animate); const time = performance.now() * .001; yaw += ((Math.atan2(26,22) + pointerX*.6) - yaw)*.055; height += ((28 - pointerY*7) - height)*.055; island.rotation.y = Math.sin(time * .16) * .008; camera.position.set(Math.cos(yaw)*34,height,Math.sin(yaw)*34); camera.lookAt(0,.7,0); flag.rotation.z = Math.sin(time * 2.3) * .08; animals.forEach((animal) => { const a = time * animal.speed + animal.phase, dx = -Math.sin(a), dz = Math.cos(a)*.65; animal.group.position.set(animal.cx + Math.cos(a)*animal.radius, .02 + Math.abs(Math.sin(a*3))* .05, animal.cz + Math.sin(a)*animal.radius*.65); animal.group.rotation.y = Math.atan2(-dz, dx); animal.legs.forEach((leg,index) => { leg.rotation.z = Math.sin(a*8 + (index%2)*Math.PI)*.52 }) }); windmillRotors.forEach((rotor,index)=>{rotor.rotation.z=time*(.75+index*.15)}); birds.forEach((bird) => { const travel = ((time*bird.speed + bird.phase) % 1); bird.group.position.x = bird.startX + travel*130; bird.group.position.y = bird.altitude + Math.sin(time*1.1+bird.phase)*.22; bird.group.position.z = bird.startZ + Math.sin(time*.32+bird.phase)*2.1; bird.group.children.forEach((wing,index) => { wing.rotation.z = (index ? -1 : 1) * (.28 + Math.sin(time*4.1+bird.phase)*.38) }) }); renderer.render(scene, camera) }
    animate()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); host.removeEventListener('pointermove', move); renderer.dispose(); host.removeChild(renderer.domElement) }
  }, [])
  return <div ref={mountRef} className="clash-village-map" />
}
