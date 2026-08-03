import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const makeMaterial = (color: number, roughness = .8) => new THREE.MeshStandardMaterial({ color, roughness, flatShading: true })

/**
 * Mounts the canonical home kingdom scene into a supplied host.
 *
 * Keeping the Three.js construction in this standalone controller is the first
 * extraction step: React owns the mount/unmount lifecycle, while a future
 * battle adapter can reuse this exact scene construction rather than rebuild
 * an approximation of it.
 */
export const mountClashVillageScene = (host: HTMLDivElement) => {

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
        const tuft=new THREE.Group();tuft.userData.keepGrass=true;tuft.position.set(point.x+nx*(width*.62),.12,point.z+nz*(width*.62));tuft.rotation.y=i*1.71;island.add(tuft)
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
    const addGroundTuft = (x:number,z:number,scale=1) => {
      const tuft=new THREE.Group();tuft.userData.keepGrass=true;tuft.position.set(x,.12,z);tuft.rotation.y=(x*3.7+z*1.9)%Math.PI;island.add(tuft)
      for(let i=0;i<4;i++){const blade=new THREE.Mesh(new THREE.ConeGeometry(.025+(i%2)*.012,(.2+i*.045)*scale,3),makeMaterial(0x91b989));blade.position.set((i-1.5)*.045,(.1+i*.022)*scale,(i%2-.5)*.06);blade.rotation.z=(i-1.5)*.12;tuft.add(blade)}
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
    const homeSites=[[-15,5,.88],[-13,7,.76],[-16,8,.78],[-14,-7,.82],[-16,-10,.76],
      [14,-5,.9],[16,-3,.75],[18,-8,.78],[-5,-14,.8],[-1,-16,.9],[0,15,.72],[15,12,.8],[10,16,.76]]
    homeSites.forEach(([x,z,s], index) => addHouse(x,z,index%2?0xe0bd78:0xd8a76a,index%3?0xc85b43:0x627492,s))

    // Open-front stable beside the castle's main exit, with two visible horses in their stalls.
    const addHorseShed = (x:number,z:number,rotation=0) => {
      const shed=new THREE.Group();shed.position.set(x,.38,z);shed.rotation.y=rotation;island.add(shed)
      const floor=new THREE.Mesh(new THREE.BoxGeometry(3.35,.18,2.65),makeMaterial(0x9b7b58));floor.position.y=.09;floor.receiveShadow=true;shed.add(floor)
      const back=new THREE.Mesh(new THREE.BoxGeometry(3.2,2.2,.18),makeMaterial(0xb18d63));back.position.set(0,1.2,-1.2);back.castShadow=true;shed.add(back)
      ;[[-1.42,-1.08], [1.42,-1.08], [-1.42,1.08], [1.42,1.08]].forEach(([px,pz])=>{const post=new THREE.Mesh(new THREE.CylinderGeometry(.11,.14,2.65,6),makeMaterial(0x72513a));post.position.set(px,1.33,pz);post.castShadow=true;shed.add(post)})
      const roof=new THREE.Mesh(new THREE.ConeGeometry(2.5,1.5,4),makeMaterial(0x6f8fa0));roof.position.y=3.12;roof.rotation.y=Math.PI/4;roof.castShadow=true;shed.add(roof)
      const makeHorse = (hx:number) => {const horse=new THREE.Group();horse.position.set(hx,.18,.12);shed.add(horse);const body=new THREE.Mesh(new THREE.SphereGeometry(.48,8,6),makeMaterial(0x8a5d43));body.scale.set(1.35,.78,.78);body.position.y=.64;horse.add(body);const neck=new THREE.Mesh(new THREE.CylinderGeometry(.17,.23,.58,6),makeMaterial(0x8a5d43));neck.position.set(.46,.95,0);neck.rotation.z=-.45;horse.add(neck);const head=new THREE.Mesh(new THREE.SphereGeometry(.22,7,6),makeMaterial(0x744832));head.position.set(.66,1.2,0);horse.add(head);for(const [lx,lz] of [[-.28,-.22],[-.28,.22],[.3,-.22],[.3,.22]]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.045,.055,.52,5),makeMaterial(0x543729));leg.position.set(lx,.28,lz);horse.add(leg)}}
      makeHorse(-.65);makeHorse(.65);addGroundTuft(x-1.8,z-1.3,.9);addGroundTuft(x+1.8,z+1.25,.8)
    }
    addHorseShed(-5.8,7.5,Math.PI/2)

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
    addStorage(7, -4.3, 0xe568d3); addStorage(14, 2.2, 0x6bc9ed)

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
      const soil = new THREE.Mesh(new THREE.PlaneGeometry(5.1,3.6),makeMaterial(0x887052));soil.rotation.x=-Math.PI/2;soil.position.set(x+1.2,.08,z-4.0);island.add(soil)
      // Simple hand-built fence enclosing the crop plot.
      const railMat=makeMaterial(0x86634a)
      ;[[0,-1.8,5.2,.13],[0,1.8,5.2,.13],[-2.6,0,.13,3.7],[2.6,0,.13,3.7]].forEach(([dx,dz,w,d])=>{const rail=new THREE.Mesh(new THREE.BoxGeometry(w,.14,d),railMat);rail.position.set(x+1.2+dx,.48,z-4+dz);rail.castShadow=true;island.add(rail)})
      for(let row=0;row<4;row++)for(let col=0;col<6;col++){const crop=new THREE.Mesh(new THREE.ConeGeometry(.11,.62,5),makeMaterial((row+col)%4?0x7ea459:0xd2ba4d));crop.position.set(x-.63+col*.72,.36,z-5.1+row*.72);island.add(crop)}
    }
    addHut(-10,4.7,'farm',1.05); addHut(9,4.4,'forge',.98); addHut(-8.8,-7,'depot',.95); addFarmstead(5,-11); addHut(-20,-2,'farm',1.18); addWindmill(10,-13)

    // Civic landmarks make the settlement read as a lived-in, defended civilization.
    const addWatchPost = (x:number,z:number) => {
      const post=new THREE.Group();post.position.set(x,.38,z);island.add(post);addGroundTuft(x-1,z-1,.85);addGroundTuft(x+1,z+.9,.78)
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
    const campfireSmoke: { puff: THREE.Mesh; material: THREE.MeshStandardMaterial; phase: number; x: number; z: number }[] = []
    const campfireFlames: THREE.Mesh[] = []
    const addCampfire = (x:number,z:number) => {
      const fire=new THREE.Group();fire.position.set(x,.39,z);island.add(fire);addGroundTuft(x-1.15,z-.62,.7);addGroundTuft(x+1.1,z+.55,.6)
      const ash=new THREE.Mesh(new THREE.CylinderGeometry(.72,.88,.12,10),makeMaterial(0x5b554c));ash.position.y=.08;fire.add(ash)
      for(let i=0;i<8;i++){const a=i*Math.PI*2/8;const stone=new THREE.Mesh(new THREE.DodecahedronGeometry(.22,0),makeMaterial(i%2?0x8d887d:0xa6a091));stone.position.set(Math.cos(a)*.82,.18,Math.sin(a)*.82);stone.scale.set(1,.58,.8);fire.add(stone)}
      ;[-.42,.42].forEach((offset,index)=>{const log=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,1.45,6),makeMaterial(0x71442f));log.rotation.z=Math.PI/2;log.rotation.y=index?Math.PI/2:0;log.position.set(0,.25,offset);fire.add(log)})
      const ember=new THREE.Mesh(new THREE.SphereGeometry(.36,7,5),makeMaterial(0xff983d,.35));ember.scale.y=.32;ember.position.y=.34;fire.add(ember)
      const outer=new THREE.Mesh(new THREE.ConeGeometry(.4,.76,6),makeMaterial(0xe85c2e,.45));outer.position.y=.69;fire.add(outer);campfireFlames.push(outer)
      const inner=new THREE.Mesh(new THREE.ConeGeometry(.19,.48,6),makeMaterial(0xffdc63,.4));inner.position.set(.04,.72,.02);fire.add(inner);campfireFlames.push(inner)
      for(let i=0;i<4;i++){const smokeMat=new THREE.MeshStandardMaterial({color:0xd9dde0,roughness:1,flatShading:true,transparent:true,opacity:.34,depthWrite:false});const puff=new THREE.Mesh(new THREE.IcosahedronGeometry(.28+i*.035,1),smokeMat);fire.add(puff);campfireSmoke.push({puff,material:smokeMat,phase:i*.23,x,z})}
    }
    const addSignpost = (x:number,z:number) => {const sign=new THREE.Group();sign.position.set(x,.38,z);island.add(sign);addGroundTuft(x-.2,z+.18,.72);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.09,1.25,6),makeMaterial(0x755038));pole.position.y=.63;sign.add(pole);const arm=new THREE.Mesh(new THREE.BoxGeometry(.9,.25,.1),makeMaterial(0xceb16c));arm.position.set(.28,1.12,0);arm.rotation.y=.2;sign.add(arm)}
    const addLantern = (x:number,z:number) => {const post=new THREE.Group();post.position.set(x,.38,z);island.add(post);addGroundTuft(x+.12,z-.12,.65);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.06,1.35,6),makeMaterial(0x5e4b3b));pole.position.y=.68;post.add(pole);const light=new THREE.Mesh(new THREE.OctahedronGeometry(.16),makeMaterial(0xf2d77b,.35));light.position.y=1.42;post.add(light)}
    addWatchPost(-5.1,17);addWatchPost(5.1,17);addWatchPost(16,-12)
    addMarket(12,11)
    addCampfire(-12.3,-10.6)
    addSignpost(7.5,-3);addSignpost(-7,2);addSignpost(5,-10);addSignpost(-14,-7)
    addLantern(-2.1,6.5);addLantern(2.1,6.5);addLantern(-13,5);addLantern(-12,-8);addLantern(12,-5);addLantern(7,12)

    // Only settlements and substantial civic buildings are upgradeable; props stay uncluttered.
    const upgradeSparkles: { mesh: THREE.Mesh; started: number; phase: number; x:number; z:number }[] = []
    const upgradeButtons: THREE.Sprite[] = []
    const plusCanvas=document.createElement('canvas');plusCanvas.width=96;plusCanvas.height=96
    const plusCtx=plusCanvas.getContext('2d')
    if(plusCtx){plusCtx.fillStyle='#fff8d3';plusCtx.strokeStyle='#326b87';plusCtx.lineWidth=8;plusCtx.beginPath();plusCtx.arc(48,48,35,0,Math.PI*2);plusCtx.fill();plusCtx.stroke();plusCtx.fillStyle='#e78e30';plusCtx.beginPath();plusCtx.arc(48,48,27,0,Math.PI*2);plusCtx.fill();plusCtx.fillStyle='#fff7c8';plusCtx.fillRect(42,27,12,42);plusCtx.fillRect(27,42,42,12)}
    const plusTexture=new THREE.CanvasTexture(plusCanvas)
    const upgradeStructure = (button:THREE.Sprite) => {
      if(button.userData.upgraded)return
      button.userData.upgraded=true;button.visible=false
      const { x,z,top,radius }=button.userData as {x:number;z:number;top:number;radius:number}
      const addition=new THREE.Group();addition.position.set(x,.39,z);island.add(addition)
      const collar=new THREE.Mesh(new THREE.TorusGeometry(radius,.11,5,12),makeMaterial(0xd5b768));collar.rotation.x=Math.PI/2;collar.position.y=.25;addition.add(collar)
      const tower=new THREE.Mesh(new THREE.CylinderGeometry(.3,.38,.86,7),makeMaterial(0x9da89c));tower.position.set(radius*.58,top-1.08,-radius*.34);tower.castShadow=true;addition.add(tower)
      const roof=new THREE.Mesh(new THREE.ConeGeometry(.48,.64,6),makeMaterial(0x507fa0));roof.position.set(radius*.58,top-.33,-radius*.34);roof.castShadow=true;addition.add(roof)
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.92,6),makeMaterial(0x765139));pole.position.set(radius*.58,top+.4,-radius*.34);addition.add(pole)
      const banner=new THREE.Mesh(new THREE.PlaneGeometry(.46,.3),new THREE.MeshBasicMaterial({color:0xf0c14d,side:THREE.DoubleSide}));banner.position.set(radius*.8,top+.38,-radius*.34);addition.add(banner)
      for(let i=0;i<12;i++){const sparkle=new THREE.Mesh(new THREE.OctahedronGeometry(.11+(i%3)*.025),makeMaterial(0xffe47a,.35));sparkle.position.set(x,.8,z);scene.add(sparkle);upgradeSparkles.push({mesh:sparkle,started:performance.now()*.001,phase:i/12*Math.PI*2,x,z})}
    }
    const addUpgradeButton = (id:string,x:number,z:number,top:number,radius=1.35) => {
      const button=new THREE.Sprite(new THREE.SpriteMaterial({map:plusTexture,depthTest:false,depthWrite:false,transparent:true}));button.position.set(x,top,z);button.scale.set(.82,.82,1);button.userData={id,x,z,top,radius,upgraded:false};scene.add(button);upgradeButtons.push(button)
    }
    addUpgradeButton('A',0,0,11.25,4.7);addUpgradeButton('C',-20,-2,5.9);addUpgradeButton('D',10,-13,8.45);addUpgradeButton('E',-5.8,7.5,5.7);addUpgradeButton('F',12,11,5.2)
    addUpgradeButton('H',14,2.2,5);addUpgradeButton('I',9,4.4,5.15);addUpgradeButton('J',-8.8,-7,4.9);addUpgradeButton('L',16,-12,6.3);addUpgradeButton('M',-5.1,17,6.3);addUpgradeButton('N',5.1,17,6.3)
    homeSites.forEach(([x,z],index)=>addUpgradeButton(`H${index+1}`,x,z,4.9));addUpgradeButton('S2',7,-4.3,5);addUpgradeButton('O1',-10,4.7,5.15)
    // The Builder starts with an empty landscape. Keep its terrain and grass
    // details, but clear all prebuilt paths, monuments, and upgrade markers.
    island.children.slice().forEach(child=>{if(child!==countryside&&!child.userData.keepGrass)island.remove(child)})
    upgradeButtons.forEach(button=>scene.remove(button))
    upgradeButtons.length=0
    // Fill the buildable clearing with small, irregularly spaced grass clusters.
    // A deterministic scatter keeps the scene stable without forming a visible grid.
    for(let i=0;i<240;i++){
      const angle=i*2.39996323
      const radius=Math.sqrt((i+.55)/240)*24
      const x=Math.cos(angle)*radius*1.14+Math.sin(i*1.73)*.72
      const z=Math.sin(angle)*radius*.82+Math.cos(i*1.21)*.55
      addGroundTuft(x,z,.72+(i%7)*.075)
    }
    // Keep the middle open for building. The dense forest begins well outside
    // the clearing rather than scattering individual trees through it.
    // Instanced circular forest: twelve concentric bands continue past the view, never revealing a square map edge.
    const forestBands = 12, treesPerBand = 68, forestCount = forestBands * treesPerBand
    const forestTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.16,.25,1.25,7),makeMaterial(0x704929),forestCount)
    const forestLeaves = new THREE.InstancedMesh(new THREE.ConeGeometry(.92,2.45,8),makeMaterial(0x4f932f),forestCount)
    forestTrunks.castShadow=true;forestLeaves.castShadow=true;forestTrunks.receiveShadow=true;forestLeaves.receiveShadow=true
    const treeMatrix = new THREE.Object3D()
    let forestIndex=0
    for(let band=0;band<forestBands;band++) for(let i=0;i<treesPerBand;i++){
      const seed=forestIndex*17.41, angle=(i/treesPerBand)*Math.PI*2+band*.19
      const radius=26+band*2.85+Math.sin(seed)*.78, scale=.76+((i*7+band*3)%8)*.1
      const x=Math.cos(angle)*radius*1.18, z=Math.sin(angle)*radius*.9
      treeMatrix.position.set(x,.4+(.62*scale),z);treeMatrix.rotation.set(0,angle+.22,0);treeMatrix.scale.setScalar(scale);treeMatrix.updateMatrix();forestTrunks.setMatrixAt(forestIndex,treeMatrix.matrix)
      treeMatrix.position.set(x,.4+(1.85*scale),z);treeMatrix.scale.setScalar(scale);treeMatrix.updateMatrix();forestLeaves.setMatrixAt(forestIndex,treeMatrix.matrix)
      forestIndex++
    }
    forestTrunks.count=forestIndex;forestLeaves.count=forestIndex;forestTrunks.instanceMatrix.needsUpdate=true;forestLeaves.instanceMatrix.needsUpdate=true;island.add(forestTrunks,forestLeaves)

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

    const builderTypes=['house','station1','station2','station3','station4','station5','station6','station7','station8','station9','station10','watchtower','guildhall','fountain','forge','garden','bannerpost','castle','cottage','stable','storage','farm','windmill','well','market','trainingyard','campfire','signpost','lantern'] as const
    type BuilderType=typeof builderTypes[number]
    const rotationButtons: THREE.Sprite[]=[]
    const deleteButtons: THREE.Sprite[]=[]
    const rotationCanvas=document.createElement('canvas');rotationCanvas.width=96;rotationCanvas.height=96
    const rotationCtx=rotationCanvas.getContext('2d')
    if(rotationCtx){rotationCtx.fillStyle='#ffffff';rotationCtx.font='700 54px Arial';rotationCtx.textAlign='center';rotationCtx.textBaseline='middle';rotationCtx.fillText('↻',48,49)}
    const rotationTexture=new THREE.CanvasTexture(rotationCanvas)
    const deleteCanvas=document.createElement('canvas');deleteCanvas.width=96;deleteCanvas.height=96
    const deleteCtx=deleteCanvas.getContext('2d')
    if(deleteCtx){deleteCtx.fillStyle='#e64b48';deleteCtx.font='700 68px Arial';deleteCtx.textAlign='center';deleteCtx.textBaseline='middle';deleteCtx.fillText('×',48,51)}
    const deleteTexture=new THREE.CanvasTexture(deleteCanvas)
    const addRotationButton=(monument:THREE.Group,x:number,z:number,height:number)=>{const button=new THREE.Sprite(new THREE.SpriteMaterial({map:rotationTexture,depthTest:false,depthWrite:false,transparent:true}));const remove=new THREE.Sprite(new THREE.SpriteMaterial({map:deleteTexture,depthTest:false,depthWrite:false,transparent:true}));button.position.set(x-.72,height,z);remove.position.set(x+.72,height,z);button.scale.set(2.25,2.25,1);remove.scale.set(2.25,2.25,1);button.userData={monument,x,z,deleteButton:remove};remove.userData={monument,rotationButton:button};button.visible=false;remove.visible=false;scene.add(button,remove);rotationButtons.push(button);deleteButtons.push(remove)}
    const placeBuilderMonument=(type:BuilderType,x:number,z:number,isPreview=false)=>{
      const group=new THREE.Group();group.position.set(x,.38,z);island.add(group)
      const add=(geometry:THREE.BufferGeometry,color:number,y=0)=>{const mesh=new THREE.Mesh(geometry,makeMaterial(color));mesh.position.y=y;mesh.castShadow=true;group.add(mesh);return mesh}
      add(new THREE.CylinderGeometry(1.45,1.62,.18,12),0x8f7658,.09)
      let buttonHeight=3
      if(type==='house'){add(new THREE.CylinderGeometry(1.02,1.16,1.42,8),0xe0bd78,.8);add(new THREE.ConeGeometry(1.42,1.28,7),0xc85b43,2.12);const door=add(new THREE.BoxGeometry(.48,.74,.08),0x71483a,.45);door.position.z=.98;buttonHeight=3.2}
      else if(type.startsWith('station')){const variant=Number(type.slice(7)),roofColors=[0x477cb2,0x386ba3,0x5d6fa8,0xd65443,0x527c9c,0x426a91,0x6f8fa0,0x486e9a,0x5b6f9e,0x315f99],woodColors=[0x8c6745,0x765139,0x9b704b,0x704929,0x916f50,0x79543c,0x9b7b58,0x6f5848,0x755038,0x826048],towerHeight=2.7+(variant%4)*.42,deck=2.25+(variant%3)*.24;add(new THREE.CylinderGeometry(1.36,1.66,.52,8),0x777a74,.34);[[-.9,-.62],[.9,-.62],[-.9,.62],[.9,.62]].forEach(([px,pz])=>{const leg=add(new THREE.CylinderGeometry(.1,.13,towerHeight,6),woodColors[variant-1],.34+towerHeight/2);leg.position.set(px,.34+towerHeight/2,pz)});[-1,1].forEach(side=>{const brace=add(new THREE.BoxGeometry(.1,towerHeight*.82,.1),woodColors[variant-1],.8+towerHeight*.35);brace.position.set(side*.75,.8+towerHeight*.35,.66);brace.rotation.z=side*(.45+(variant%3)*.06)});add(new THREE.BoxGeometry(deck,.22,1.78),woodColors[variant-1],towerHeight+.68);if(variant===4||variant===8){add(new THREE.CylinderGeometry(1.04,1.2,1.36,8),0xa39273,towerHeight+1.42);add(new THREE.ConeGeometry(1.52,.94,6),roofColors[variant-1],towerHeight+2.5)}else{add(new THREE.BoxGeometry(1.74+(variant%2)*.3,1.2+(variant%3)*.12,1.4),0x916f50,towerHeight+1.42);add(new THREE.ConeGeometry(1.45+(variant%2)*.16,.94,4),roofColors[variant-1],towerHeight+2.54)}if(variant===2||variant===5||variant===7){const deckWing=add(new THREE.BoxGeometry(.96,.13,1.08),woodColors[variant-1],towerHeight+.88);deckWing.position.x=-1.38}if(variant===6||variant===9){add(new THREE.ConeGeometry(.3,.74,6),0xe85c2e,towerHeight+1.15).position.z=.88}const pole=add(new THREE.CylinderGeometry(.05,.06,2.12,6),0x704929,towerHeight+3.62);pole.position.x=.74;const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.58),new THREE.MeshBasicMaterial({color:roofColors[variant-1],side:THREE.DoubleSide}));flag.position.set(1.3,towerHeight+4.16,0);flag.rotation.y=Math.PI/2;group.add(flag);buttonHeight=towerHeight+4.85}
      else if(false && type.startsWith('station')){const variant=Number(type.slice(7));if(variant===1){add(new THREE.CylinderGeometry(1.48,1.64,.18,10),0x916f50,.18);add(new THREE.ConeGeometry(1.35,1.46,7),0xd65443,1.42);const pole=add(new THREE.CylinderGeometry(.06,.08,2.45,5),0x765139,1.42);pole.position.x=1.15;buttonHeight=3.85}else if(variant===2){add(new THREE.BoxGeometry(2.6,.18,1.9),0x916f50,.18);const back=add(new THREE.BoxGeometry(2.35,1.64,.16),0xb18d63,.98);back.position.z=-.8;add(new THREE.ConeGeometry(1.86,.88,4),0x477cb2,2.04);buttonHeight=3.65}else if(variant===3){add(new THREE.CylinderGeometry(1.62,1.62,.14,12),0xbda978,.14);for(let i=0;i<4;i++){const post=add(new THREE.CylinderGeometry(.08,.1,1.38,5),0x765139,.78);post.position.set(Math.cos(i*Math.PI/2)*1.2,.78,Math.sin(i*Math.PI/2)*1.2)}buttonHeight=2.5}else if(variant===4){add(new THREE.CylinderGeometry(1.68,1.82,.24,9),0x78533b,.22);for(let i=0;i<8;i++){const post=add(new THREE.CylinderGeometry(.1,.13,1.72,5),0x8c6745,.96);post.position.set(Math.cos(i*Math.PI/4)*1.4,.96,Math.sin(i*Math.PI/4)*1.4)}add(new THREE.ConeGeometry(.64,1.16,6),0xd65443,1.9);buttonHeight=3.45}else if(variant===5){add(new THREE.CylinderGeometry(.78,.93,2.65,8),0xa39273,1.5);add(new THREE.ConeGeometry(1.18,1.12,6),0x477cb2,3.32);add(new THREE.CylinderGeometry(1.34,1.34,.16,10),0x916f50,.16);buttonHeight=4.7}else if(variant===6){add(new THREE.BoxGeometry(2.4,.2,1.76),0x716354,.18);add(new THREE.CylinderGeometry(.94,1.1,1.52,8),0x744447,1.02);add(new THREE.ConeGeometry(1.38,.9,6),0x3c2a35,2.12);const fire=add(new THREE.SphereGeometry(.36,7,6),0xff9d46,.85);fire.scale.y=.55;fire.position.z=1.1;buttonHeight=3.65}else if(variant===7){add(new THREE.BoxGeometry(2.8,.18,1.95),0x9b7b58,.18);const back=add(new THREE.BoxGeometry(2.55,1.48,.16),0xb18d63,.9);back.position.z=-.84;add(new THREE.ConeGeometry(1.98,.8,4),0x6f8fa0,1.9);[-.72,.72].forEach(px=>{const horse=add(new THREE.SphereGeometry(.4,7,6),0x8a5d43,.68);horse.scale.set(1.35,.75,.75);horse.position.set(px,.68,.2)});buttonHeight=3.55}else if(variant===8){add(new THREE.CylinderGeometry(.84,.98,3.15,8),0xa39273,1.73);add(new THREE.ConeGeometry(1.24,1.3,6),0x6e91ad,3.95);buttonHeight=4.95}else if(variant===9){add(new THREE.CylinderGeometry(1.34,1.48,.2,10),0x5b554c,.18);add(new THREE.CylinderGeometry(.92,1.1,1.58,8),0x6d3b3d,1.0);add(new THREE.ConeGeometry(1.38,.92,6),0x3f2631,2.18);add(new THREE.ConeGeometry(.44,.98,6),0xe85c2e,.95);buttonHeight=3.75}else{add(new THREE.CylinderGeometry(1.36,1.65,.5,8),0x777a74,.34);[[-.88,-.6],[.88,-.6],[-.88,.6],[.88,.6]].forEach(([px,pz])=>{const leg=add(new THREE.CylinderGeometry(.09,.12,2.8,6),0x704929,1.72);leg.position.set(px,1.72,pz)});[-1,1].forEach(side=>{const brace=add(new THREE.BoxGeometry(.1,2.15,.1),0x765139,1.65);brace.position.set(side*.74,1.65,.64);brace.rotation.z=side*.55});add(new THREE.BoxGeometry(2.32,.2,1.76),0x8c6745,3.1);add(new THREE.BoxGeometry(1.82,1.22,1.44),0x916f50,3.78);add(new THREE.ConeGeometry(1.5,.96,4),0x477cb2,4.86);const pole=add(new THREE.CylinderGeometry(.05,.06,2.2,6),0x704929,5.7);pole.position.x=.74;const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.58),new THREE.MeshBasicMaterial({color:0x477cb2,side:THREE.DoubleSide}));flag.position.set(1.3,6.25,0);flag.rotation.y=Math.PI/2;group.add(flag);buttonHeight=7.1}}
      else if(type==='watchtower'){add(new THREE.CylinderGeometry(.62,.72,2.15,8),0xd7c18c,1.16);add(new THREE.ConeGeometry(.9,1.0,6),0xd65345,2.74);buttonHeight=4.15}
      else if(type==='guildhall'){add(new THREE.BoxGeometry(2.2,1.3,1.65),0xe4c27d,.74);add(new THREE.ConeGeometry(1.72,.98,4),0x477cb2,1.87);buttonHeight=3.05}
      else if(type==='fountain'){add(new THREE.CylinderGeometry(1.05,1.2,.35,12),0xa49d90,.3);add(new THREE.CylinderGeometry(.74,.87,.34,12),0x6fc8dc,.58);add(new THREE.ConeGeometry(.2,.86,6),0xddebf0,1.16);buttonHeight=2.35}
      else if(type==='forge'){add(new THREE.CylinderGeometry(.94,1.1,1.32,8),0x744447,.75);add(new THREE.ConeGeometry(1.34,.86,6),0x3c2a35,1.84);const fire=add(new THREE.SphereGeometry(.34,7,6),0xff9d46,.72);fire.scale.y=.55;fire.position.z=1.08;buttonHeight=3.15}
      else if(type==='garden'){add(new THREE.CylinderGeometry(1.22,1.38,.24,10),0x657d46,.2);[[-.5,-.15],[.38,-.32],[.05,.48]].forEach(([px,pz],index)=>{const flower=add(new THREE.SphereGeometry(.34,7,6),index===1?0xf0cb51:0x8cbc57,1.0);flower.position.set(px,1.0,pz)});buttonHeight=2.25}
      else if(type==='bannerpost'){add(new THREE.CylinderGeometry(.08,.11,2.55,6),0x8f6847,1.34);const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.04,.72),new THREE.MeshBasicMaterial({color:0xe25a4d,side:THREE.DoubleSide}));flag.position.set(.55,2.08,0);flag.rotation.y=Math.PI/2;group.add(flag);buttonHeight=3.3}
      else if(type==='castle'){add(new THREE.BoxGeometry(2.5,1.62,1.95),0xb7b3a8,.92);[-.98,.98].forEach(px=>{const tower=add(new THREE.CylinderGeometry(.44,.52,2.32,8),0xa39d92,1.28);tower.position.x=px;const roof=add(new THREE.ConeGeometry(.6,.74,6),0x6e91ad,2.8);roof.position.x=px});buttonHeight=4.15}
      else if(type==='cottage'){add(new THREE.CylinderGeometry(.98,1.12,1.34,8),0xe0bd78,.76);add(new THREE.ConeGeometry(1.36,1.24,7),0xc85b43,1.98);buttonHeight=3.05}
      else if(type==='stable'){add(new THREE.BoxGeometry(2.5,.18,1.75),0x9b7b58,.18);const back=add(new THREE.BoxGeometry(2.3,1.48,.16),0xb18d63,.92);back.position.z=-.78;add(new THREE.ConeGeometry(1.76,.8,4),0x6f8fa0,1.86);buttonHeight=3.0}
      else if(type==='storage'){add(new THREE.CylinderGeometry(1.04,1.22,1.42,10),0x9d6a3d,.81);const fill=add(new THREE.SphereGeometry(.95,10,7),0xe568d3,1.46);fill.scale.y=.55;buttonHeight=2.75}
      else if(type==='farm'){add(new THREE.BoxGeometry(2.6,.14,1.95),0x887052,.15);for(let i=0;i<5;i++){const crop=add(new THREE.ConeGeometry(.11,.58,5),i%2?0x7ea459:0xd2ba4d,.48);crop.position.set(-.85+i*.42,.48,-.18)}buttonHeight=1.9}
      else if(type==='windmill'){add(new THREE.CylinderGeometry(.72,1.06,2.72,8),0xe0ba58,1.51);add(new THREE.ConeGeometry(1.06,1.18,6),0x386ba3,3.45);for(let i=0;i<4;i++){const blade=add(new THREE.BoxGeometry(.18,1.3,.08),i%2?0xf1ca50:0x4d80b8,2.35);blade.rotation.z=-i*Math.PI/2;blade.position.set(Math.sin(i*Math.PI/2)*.54,2.35+Math.cos(i*Math.PI/2)*.54,.76)}buttonHeight=4.25}
      else if(type==='well'){add(new THREE.CylinderGeometry(.84,1,.58,10),0xb9b4a8,.44);add(new THREE.ConeGeometry(1.22,.75,4),0x7a94a7,1.8);buttonHeight=2.6}
      else if(type==='market'){add(new THREE.BoxGeometry(2.2,.58,1.08),0x8b674b,.55);add(new THREE.ConeGeometry(1.64,.56,4),0x718fa3,1.9);buttonHeight=2.85}
      else if(type==='trainingyard'){add(new THREE.CylinderGeometry(1.56,1.56,.13,12),0xbda978,.13);for(let i=0;i<4;i++){const post=add(new THREE.CylinderGeometry(.07,.09,1.12,5),0x765139,.65);post.position.set(Math.cos(i*Math.PI/2)*1.18,.65,Math.sin(i*Math.PI/2)*1.18)}buttonHeight=2.1}
      else if(type==='campfire'){add(new THREE.CylinderGeometry(.7,.84,.13,10),0x5b554c,.13);add(new THREE.ConeGeometry(.44,.94,6),0xe85c2e,.62);add(new THREE.ConeGeometry(.2,.6,6),0xffdc63,.78);buttonHeight=2.15}
      else if(type==='signpost'){add(new THREE.CylinderGeometry(.06,.09,1.5,6),0x755038,.81);const arm=add(new THREE.BoxGeometry(1.12,.25,.1),0xceb16c,1.23);arm.position.x=.28;arm.rotation.y=.2;buttonHeight=2.35}
      else{add(new THREE.CylinderGeometry(.045,.06,1.55,6),0x5e4b3b,.84);add(new THREE.OctahedronGeometry(.19),0xf2d77b,1.62);buttonHeight=2.4}
      if(isPreview){
        const previewWhite=new THREE.Color(0xffffff)
        group.traverse(node=>{if(node instanceof THREE.Mesh){node.castShadow=false;const materials=Array.isArray(node.material)?node.material:[node.material];materials.forEach(material=>{material.transparent=true;material.opacity=.48;material.depthWrite=false;if(material instanceof THREE.MeshStandardMaterial){material.color.lerp(previewWhite,.3);material.emissive.set(0xffffff);material.emissiveIntensity=.1}else if(material instanceof THREE.MeshBasicMaterial){material.color.lerp(previewWhite,.3)}material.needsUpdate=true})}})
      }else addRotationButton(group,x,z,buttonHeight)
      return group
    }

    // The home kingdom begins with the full handcrafted castle: curtain walls,
    // gatehouse, four towers, windows, banners, and the tall royal flag.
    const buildKingdomCastle=(x:number,z:number)=>{
      const castle=new THREE.Group();castle.position.set(x,0,z);castle.scale.y=1.28;island.add(castle)
      const add=(geometry:THREE.BufferGeometry,color:number,y=0,px=0,pz=0)=>{const mesh=new THREE.Mesh(geometry,makeMaterial(color));mesh.position.set(px,y,pz);mesh.castShadow=true;mesh.receiveShadow=true;castle.add(mesh);return mesh}
      const box=(width:number,height:number,depth:number,color:number,px:number,pz:number)=>add(new THREE.BoxGeometry(width,height,depth),color,height/2+.38,px,pz)
      const tower=(px:number,pz:number,height:number)=>{add(new THREE.CylinderGeometry(.98,1.1,height,10),stoneMid,height/2+.38,px,pz);add(new THREE.ConeGeometry(1.18,1.75,8),roofBlue,height+1.22,px,pz);const rim=add(new THREE.TorusGeometry(1.02,.1,6,10),stoneDark,height+.25,px,pz);rim.rotation.x=Math.PI/2}
      // A broad continuous footing anchors every tower instead of leaving the
      // corner towers visually perched on the edge of a small base.
      add(new THREE.CylinderGeometry(5.7,6.05,1.12,8),stoneDark,.56)
      // Complete curtain walls join all four towers, including the former open
      // drawbridge side, for one clean castle silhouette.
      box(6.7,1.85,.7,stoneLight,0,-2.85);box(6.7,1.85,.7,stoneLight,0,2.85);box(.7,1.85,5.3,stoneLight,-3,0);box(.7,1.85,5.3,stoneLight,3,0)
      box(4.25,4.75,3.8,stoneLight,0,.45)
      ;[-1.6,-.8,0,.8,1.6].forEach(px=>{box(.43,.52,.42,stoneMid,px,-1.44).position.y=5.14;box(.43,.52,.42,stoneMid,px,2.36).position.y=5.14})
      ;[-1.35,-.55,.55,1.35].forEach(pz=>{box(.42,.52,.43,stoneMid,-2.12,pz).position.y=5.14;box(.42,.52,.43,stoneMid,2.12,pz).position.y=5.14})
      tower(-3.05,-2.85,4.35);tower(3.05,-2.85,4.35);tower(-3.05,2.85,4.05);tower(3.05,2.85,4.05)
      ;[-1.25,0,1.25].forEach(px=>{const window=box(.34,.88,.06,0x577f9b,px,2.4);window.position.y=3.3});[-.8,.8].forEach(pz=>{const window=box(.06,.72,.32,0x577f9b,2.16,pz);window.position.y=3.35})
      const pole=box(.1,3.8,.1,0x835a30,0,.45);pole.position.y=7.05
      const royalFlag=new THREE.Mesh(new THREE.PlaneGeometry(2,.92),new THREE.MeshBasicMaterial({color:0xf0b933,side:THREE.DoubleSide}));royalFlag.position.set(1,8.85,.45);castle.add(royalFlag)
      return castle
    }

    buildKingdomCastle(0,0)

    const raycaster=new THREE.Raycaster()
    let activeBuilderType:BuilderType|null=null
    let dragPreview:THREE.Group|null=null
    let dragPreviewType:BuilderType|null=null
    const clearDragPreview=()=>{if(!dragPreview)return;island.remove(dragPreview);dragPreview.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry.dispose();const materials=Array.isArray(node.material)?node.material:[node.material];materials.forEach(material=>material.dispose())}});dragPreview=null;dragPreviewType=null}
    const showDragPreview=(type:BuilderType,x:number,z:number)=>{if(dragPreviewType!==type){clearDragPreview();dragPreview=placeBuilderMonument(type,x,z,true);dragPreviewType=type}else if(dragPreview)dragPreview.position.set(x,.38,z)}
    const trackBuilderDragStart=(event:DragEvent)=>{const type=event.dataTransfer?.getData('application/x-candy-monument');activeBuilderType=builderTypes.includes(type as BuilderType)?type as BuilderType:null}
    const trackExplicitBuilderDragStart=(event:Event)=>{const type=(event as CustomEvent<string>).detail;activeBuilderType=builderTypes.includes(type as BuilderType)?type as BuilderType:null}
    const endBuilderDrag=()=>{activeBuilderType=null;clearDragPreview()}
    window.addEventListener('dragstart',trackBuilderDragStart)
    window.addEventListener('candy-builder-drag-start',trackExplicitBuilderDragStart)
    window.addEventListener('dragend',endBuilderDrag)
    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      const aspect = width / height
      // Laptop-sized desktop viewports need a little more breathing room than
      // wide external monitors, otherwise the map reads unnecessarily zoomed in.
      const halfHeight = width <= 1700 ? 18.5 : 13.5
      // Matching the horizontal and vertical world-unit scale prevents the old tall/stretchy look.
      camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect
      camera.top = halfHeight; camera.bottom = -halfHeight
      renderer.setSize(width, height, false)
      camera.updateProjectionMatrix()
    }
    resize(); window.addEventListener('resize', resize)
    let pointerX = 0, pointerY = 0, yaw = Math.atan2(26,22), height = 28, frame = 0
    const move = (event:PointerEvent) => {
      const rect=host.getBoundingClientRect(); pointerX = (event.clientX-rect.left) / rect.width - .5; pointerY = (event.clientY-rect.top) / rect.height - .5
      raycaster.setFromCamera(new THREE.Vector2(pointerX*2,-pointerY*2),camera)
      const hit=raycaster.intersectObject(countryside,false)[0]
      if(!hit){rotationButtons.forEach(button=>{button.visible=false;(button.userData.deleteButton as THREE.Sprite).visible=false});return}
      const point=island.worldToLocal(hit.point.clone())
      const pointerNdc=new THREE.Vector2(pointerX*2,-pointerY*2), controlPosition=new THREE.Vector3()
      rotationButtons.forEach(button=>{const {x,z,deleteButton}=button.userData as {x:number;z:number;deleteButton:THREE.Sprite};button.getWorldPosition(controlPosition).project(camera);const nearRotate=button.visible&&Math.hypot((controlPosition.x-pointerNdc.x)*rect.width*.5,(controlPosition.y-pointerNdc.y)*rect.height*.5)<96;deleteButton.getWorldPosition(controlPosition).project(camera);const nearDelete=button.visible&&Math.hypot((controlPosition.x-pointerNdc.x)*rect.width*.5,(controlPosition.y-pointerNdc.y)*rect.height*.5)<96;const visible=Math.hypot(point.x-x,point.z-z)<4.3||nearRotate||nearDelete;button.visible=visible;deleteButton.visible=visible})
    }
    host.addEventListener('pointermove', move)
    const hideRotationButtons=()=>rotationButtons.forEach(button=>{button.visible=false;(button.userData.deleteButton as THREE.Sprite).visible=false})
    host.addEventListener('pointerleave',hideRotationButtons)
    const upgradeClick=(event:PointerEvent)=>{const rect=host.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height*2-1)),camera);const deleteHit=raycaster.intersectObjects(deleteButtons,false).find(hit=>hit.object.visible);if(deleteHit){const monument=deleteHit.object.userData.monument as THREE.Group;island.remove(monument);rotationButtons.filter(button=>button.userData.monument===monument).forEach(button=>scene.remove(button,button.userData.deleteButton as THREE.Sprite));for(let i=rotationButtons.length-1;i>=0;i--)if(rotationButtons[i].userData.monument===monument)rotationButtons.splice(i,1);for(let i=deleteButtons.length-1;i>=0;i--)if(deleteButtons[i].userData.monument===monument)deleteButtons.splice(i,1);return}const rotateHit=raycaster.intersectObjects(rotationButtons,false).find(hit=>hit.object.visible);if(rotateHit){const monument=rotateHit.object.userData.monument as THREE.Group;monument.rotation.y+=Math.PI/2;return}const hit=raycaster.intersectObjects(upgradeButtons,false)[0];if(hit)upgradeStructure(hit.object as THREE.Sprite)}
    const allowBuilderDrop=(event:DragEvent)=>{event.preventDefault();event.dataTransfer.dropEffect='copy';const type=(activeBuilderType||event.dataTransfer.getData('application/x-candy-monument')) as BuilderType;if(!builderTypes.includes(type))return;const rect=host.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height*2-1)),camera);const hit=raycaster.intersectObject(countryside,false)[0];if(!hit)return;const point=island.worldToLocal(hit.point.clone());showDragPreview(type,point.x,point.z)}
    const dropBuilderMonument=(event:DragEvent)=>{event.preventDefault();const type=(activeBuilderType||event.dataTransfer.getData('application/x-candy-monument')) as BuilderType;if(!builderTypes.includes(type)){clearDragPreview();return}const rect=host.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height*2-1)),camera);const hit=raycaster.intersectObject(countryside,false)[0];if(!hit){clearDragPreview();return}const point=island.worldToLocal(hit.point.clone());clearDragPreview();placeBuilderMonument(type,point.x,point.z);activeBuilderType=null}
    host.addEventListener('pointerdown',upgradeClick)
    host.addEventListener('dragover',allowBuilderDrop)
    host.addEventListener('drop',dropBuilderMonument)
    const animate = () => { frame = requestAnimationFrame(animate); const time = performance.now() * .001; yaw += ((Math.atan2(26,22) + pointerX*.6) - yaw)*.055; height += ((28 - pointerY*7) - height)*.055; island.rotation.y = Math.sin(time * .16) * .008; camera.position.set(Math.cos(yaw)*34,height,Math.sin(yaw)*34); camera.lookAt(0,.7,0); flag.rotation.z = Math.sin(time * 2.3) * .08; upgradeSparkles.forEach((sparkle)=>{const age=time-sparkle.started;if(age>1.45){sparkle.mesh.visible=false;return}const spread=.35+age*1.5;sparkle.mesh.visible=true;sparkle.mesh.position.set(sparkle.x+Math.cos(sparkle.phase)*spread,1.2+age*3.1+Math.sin(sparkle.phase*3)*.18,sparkle.z+Math.sin(sparkle.phase)*spread);sparkle.mesh.rotation.y=time*6;sparkle.mesh.scale.setScalar(1-age*.45)});campfireFlames.forEach((flame,index)=>{const pulse=1+Math.sin(time*7+index)*.1;flame.scale.set(pulse,1+Math.sin(time*8+index)*.13,pulse)});campfireSmoke.forEach((smoke)=>{const life=(time*.19+smoke.phase)%1;const scale=.55+life*.95;smoke.puff.position.set(Math.sin(time*1.3+smoke.phase*9)*.18,1.45+life*3.9,Math.cos(time*1.1+smoke.phase*7)*.16);smoke.puff.scale.setScalar(scale);smoke.puff.rotation.y=time+smoke.phase*8;smoke.material.opacity=(1-life)*.3}); animals.forEach((animal) => { const a = time * animal.speed + animal.phase, dx = -Math.sin(a), dz = Math.cos(a)*.65; animal.group.position.set(animal.cx + Math.cos(a)*animal.radius, .02 + Math.abs(Math.sin(a*3))* .05, animal.cz + Math.sin(a)*animal.radius*.65); animal.group.rotation.y = Math.atan2(-dz, dx); animal.legs.forEach((leg,index) => { leg.rotation.z = Math.sin(a*8 + (index%2)*Math.PI)*.52 }) }); windmillRotors.forEach((rotor,index)=>{rotor.rotation.z=time*(.75+index*.15)}); birds.forEach((bird) => { const travel = ((time*bird.speed + bird.phase) % 1); bird.group.position.x = bird.startX + travel*130; bird.group.position.y = bird.altitude + Math.sin(time*1.1+bird.phase)*.22; bird.group.position.z = bird.startZ + Math.sin(time*.32+bird.phase)*2.1; bird.group.children.forEach((wing,index) => { wing.rotation.z = (index ? -1 : 1) * (.28 + Math.sin(time*4.1+bird.phase)*.38) }) }); renderer.render(scene, camera) }
    animate()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize);window.removeEventListener('dragstart',trackBuilderDragStart);window.removeEventListener('candy-builder-drag-start',trackExplicitBuilderDragStart);window.removeEventListener('dragend',endBuilderDrag);clearDragPreview(); host.removeEventListener('pointermove', move);host.removeEventListener('pointerleave',hideRotationButtons); host.removeEventListener('pointerdown',upgradeClick);host.removeEventListener('dragover',allowBuilderDrop);host.removeEventListener('drop',dropBuilderMonument); renderer.dispose(); host.removeChild(renderer.domElement) }
}

export const ClashVillageMap = () => {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = mountRef.current
    if (!host) return
    return mountClashVillageScene(host)
  }, [])

  return <div ref={mountRef} className="clash-village-map" />
}
