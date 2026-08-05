import * as THREE from 'three'

type MaterialFactory = (color: number) => THREE.MeshStandardMaterial

export const addHomeHouse = (parent: THREE.Group, material: MaterialFactory, roofColor = 0xc85b43) => {
  const add=(geometry:THREE.BufferGeometry,color:number,y:number)=>{const mesh=new THREE.Mesh(geometry,material(color));mesh.position.y=y;mesh.castShadow=true;parent.add(mesh);return mesh}
  add(new THREE.CylinderGeometry(1.45,1.62,.18,12),0x8f7658,.09);add(new THREE.CylinderGeometry(1.02,1.16,1.42,8),0xe0bd78,.8);add(new THREE.ConeGeometry(1.42,1.28,7),roofColor,2.12)
}

export const addHomeOutpost = (parent: THREE.Group, material: MaterialFactory) => {
  const add=(geometry:THREE.BufferGeometry,color:number,y:number)=>{const mesh=new THREE.Mesh(geometry,material(color));mesh.position.y=y;mesh.castShadow=true;parent.add(mesh);return mesh}
  add(new THREE.CylinderGeometry(1.36,1.66,.52,8),0x777a74,.34);[[-.9,-.62],[.9,-.62],[-.9,.62],[.9,.62]].forEach(([x,z])=>{const leg=add(new THREE.CylinderGeometry(.1,.13,3.12,6),0x8c6745,1.9);leg.position.set(x,1.9,z)});add(new THREE.BoxGeometry(2.25,.22,1.78),0x8c6745,3.8);add(new THREE.BoxGeometry(2.04,1.32,1.4),0x916f50,4.54);const roof=add(new THREE.ConeGeometry(1.61,.94,4),0x477cb2,5.66);roof.rotation.y=Math.PI/4;const pole=add(new THREE.CylinderGeometry(.05,.06,2.12,6),0x704929,6.74);pole.position.x=.74;const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.58),new THREE.MeshBasicMaterial({color:0x477cb2,side:THREE.DoubleSide}));flag.position.set(1.29,7.28,0);parent.add(flag)
}

export const addHomeCastle = (parent: THREE.Object3D, material: MaterialFactory, x:number, z:number) => {
  const group=new THREE.Group();group.position.set(x,0,z);parent.add(group)
  const add=(geometry:THREE.BufferGeometry,color:number,y:number,px=0,pz=0)=>{const mesh=new THREE.Mesh(geometry,material(color));mesh.position.set(px,y,pz);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh}
  const box=(w:number,h:number,d:number,c:number,px:number,pz:number)=>add(new THREE.BoxGeometry(w,h,d),c,h/2+.38,px,pz)
  add(new THREE.CylinderGeometry(5.7,6.05,1.12,8),0x777a74,.56);box(6.7,1.85,.7,0xc7bdaa,0,-2.85);box(6.7,1.85,.7,0xc7bdaa,0,2.85);box(.7,1.85,5.3,0xc7bdaa,-3,0);box(.7,1.85,5.3,0xc7bdaa,3,0);box(4.25,4.75,3.8,0xc7bdaa,0,.45)
  ;[-1.6,-.8,0,.8,1.6].forEach(px=>{box(.43,.52,.42,0xa89f91,px,-1.44).position.y=5.14;box(.43,.52,.42,0xa89f91,px,2.36).position.y=5.14});[-1.35,-.55,.55,1.35].forEach(pz=>{box(.42,.52,.43,0xa89f91,-2.12,pz).position.y=5.14;box(.42,.52,.43,0xa89f91,2.12,pz).position.y=5.14})
  ;[[-3.05,-2.85,4.35],[3.05,-2.85,4.35],[-3.05,2.85,4.05],[3.05,2.85,4.05]].forEach(([px,pz,h])=>{add(new THREE.CylinderGeometry(.98,1.1,h,10),0xa89f91,h/2+.38,px,pz);add(new THREE.ConeGeometry(1.18,1.75,8),0x718ba0,h+1.22,px,pz)})
  ;[-1.25,0,1.25].forEach(px=>{const win=box(.34,.88,.06,0x577f9b,px,2.4);win.position.y=3.3});const pole=box(.1,3.8,.1,0x835a30,0,.45);pole.position.y=7.05;const flag=new THREE.Mesh(new THREE.PlaneGeometry(2,.92),new THREE.MeshBasicMaterial({color:0xf0b933,side:THREE.DoubleSide}));flag.position.set(1,8.85,.45);group.add(flag)
  return group
}
