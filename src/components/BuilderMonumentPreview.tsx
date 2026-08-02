import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export type BuilderMonument = 'watchtower' | 'guildhall' | 'fountain' | 'forge' | 'garden' | 'bannerpost'

const makeMaterial = (color:number) => new THREE.MeshStandardMaterial({ color, roughness:.78, flatShading:true })

export const BuilderMonumentPreview = ({ type }: { type: BuilderMonument }) => {
  const hostRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-2.5,2.5,1.9,-1.9,.1,30)
    camera.position.set(4.4,4.5,6.2); camera.lookAt(0,1,0)
    const renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true })
    renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(58,44,false)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    host.appendChild(renderer.domElement)
    scene.add(new THREE.HemisphereLight(0xfff4d1,0x56758b,2.3))
    const sun = new THREE.DirectionalLight(0xffe0a0,2.1); sun.position.set(-3,6,5); scene.add(sun)
    const monument = new THREE.Group(); scene.add(monument)
    const add = (geometry:THREE.BufferGeometry,color:number,x=0,y=0,z=0) => { const mesh=new THREE.Mesh(geometry,makeMaterial(color));mesh.position.set(x,y,z);monument.add(mesh);return mesh }
    add(new THREE.CylinderGeometry(1.42,1.55,.16,12),0x907c58,0,.08,0)
    if(type==='watchtower'){
      add(new THREE.CylinderGeometry(.58,.68,1.95,8),0xd6c08a,0,1.06,0);add(new THREE.ConeGeometry(.86,.94,6),0xd65345,0,2.47,0)
      add(new THREE.BoxGeometry(.18,.58,.08),0x70483a,0,.63,.64)
    }else if(type==='guildhall'){
      add(new THREE.BoxGeometry(2.05,1.25,1.55),0xe4c27d,0,.72,0);add(new THREE.ConeGeometry(1.66,.92,4),0x477cb2,0,1.8,0)
      add(new THREE.BoxGeometry(.42,.68,.08),0x71483a,0,.43,.82)
    }else if(type==='fountain'){
      add(new THREE.CylinderGeometry(1.02,1.16,.35,12),0xa49d90,0,.3,0);add(new THREE.CylinderGeometry(.72,.84,.33,12),0x6fc8dc,0,.58,0)
      add(new THREE.ConeGeometry(.18,.8,6),0xddebf0,0,1.07,0);add(new THREE.SphereGeometry(.22,7,6),0x86dff0,0,1.52,0)
    }else if(type==='forge'){
      add(new THREE.CylinderGeometry(.9,1.05,1.25,8),0x744447,0,.71,0);add(new THREE.ConeGeometry(1.28,.82,6),0x3d2b35,0,1.72,0)
      add(new THREE.CircleGeometry(.35,8),0xff9d46,0,.71,1.06)
    }else if(type==='garden'){
      add(new THREE.CylinderGeometry(1.18,1.32,.22,10),0x657d46,0,.2,0)
      ;[[-.5,-.15],[.38,-.32],[.05,.48]].forEach(([x,z],index)=>{const stem=add(new THREE.CylinderGeometry(.05,.07,.65,5),0x4d733c,x,.55,z);stem.rotation.z=(index-1)*.14;add(new THREE.SphereGeometry(.33,7,6),index===1?0xf0cb51:0x8cbc57,x,.98,z)})
    }else{
      add(new THREE.CylinderGeometry(.08,.11,2.45,6),0x8f6847,0,1.3,0);const flag=add(new THREE.PlaneGeometry(1.02,.7),0xe25a4d,.56,2.05,0);flag.rotation.y=Math.PI/2
      add(new THREE.CylinderGeometry(.6,.72,.18,10),0xb18f5e,0,.24,0)
    }
    monument.rotation.y=-.36; renderer.render(scene,camera)
    return () => { monument.traverse((node) => { if(node instanceof THREE.Mesh){node.geometry.dispose();const materials=Array.isArray(node.material)?node.material:[node.material];materials.forEach(material=>material.dispose())} }); renderer.dispose(); renderer.domElement.remove() }
  },[type])
  return <span ref={hostRef} className="kh-builder-preview kh-builder-preview-3d" aria-hidden="true" />
}
