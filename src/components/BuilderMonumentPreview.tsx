import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export type BuilderMonument = 'house' | 'station' | 'watchtower' | 'guildhall' | 'fountain' | 'forge' | 'garden' | 'bannerpost' | 'castle' | 'cottage' | 'stable' | 'storage' | 'farm' | 'windmill' | 'well' | 'market' | 'trainingyard' | 'campfire' | 'signpost' | 'lantern'

const makeMaterial = (color:number) => new THREE.MeshStandardMaterial({ color, roughness:.78, flatShading:true })

export const BuilderMonumentPreview = ({ type }: { type: BuilderMonument }) => {
  const hostRef = useRef<HTMLSpanElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Each card is a real Three.js scene. Keep renderers only for cards visible in
  // the Builder scroll area so the page never runs out of WebGL contexts.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const scrollArea = host.closest('.kh-builder-list')
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { root: scrollArea, threshold: 0.05 },
    )
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host || !isVisible) return
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-2.5,2.5,1.9,-1.9,.1,30)
    camera.position.set(4.4,4.5,6.2); camera.lookAt(0,1,0)
    const renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true })
    renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(104,78,false)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    host.appendChild(renderer.domElement)
    scene.add(new THREE.HemisphereLight(0xfff4d1,0x56758b,2.3))
    const sun = new THREE.DirectionalLight(0xffe0a0,2.1); sun.position.set(-3,6,5); scene.add(sun)
    const monument = new THREE.Group(); scene.add(monument)
    const add = (geometry:THREE.BufferGeometry,color:number,x=0,y=0,z=0) => { const mesh=new THREE.Mesh(geometry,makeMaterial(color));mesh.position.set(x,y,z);monument.add(mesh);return mesh }
    add(new THREE.CylinderGeometry(1.42,1.55,.16,12),0x907c58,0,.08,0)
    if(type==='house'){
      add(new THREE.CylinderGeometry(1.0,1.14,1.38,8),0xe0bd78,0,.78,0);add(new THREE.ConeGeometry(1.4,1.25,7),0xc85b43,0,2.08,0)
      add(new THREE.BoxGeometry(.46,.72,.08),0x71483a,0,.44,.94)
    }else if(type==='station'){
      add(new THREE.BoxGeometry(2.55,.16,1.85),0x916f50,0,.16,0);add(new THREE.BoxGeometry(2.32,1.55,.16),0xb18d63,0,.9,-.78);add(new THREE.ConeGeometry(1.82,.82,4),0x477cb2,0,1.95,0)
      ;[-.9,.9].forEach(x=>{add(new THREE.CylinderGeometry(.07,.09,2.15,5),0x765139,x,1.22,.7);const flag=add(new THREE.PlaneGeometry(.42,.52),0xe25a4d,x+.22,1.78,.7);flag.rotation.y=Math.PI/2})
    }else if(type==='watchtower'){
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
    }else if(type==='bannerpost'){
      add(new THREE.CylinderGeometry(.08,.11,2.45,6),0x8f6847,0,1.3,0);const flag=add(new THREE.PlaneGeometry(1.02,.7),0xe25a4d,.56,2.05,0);flag.rotation.y=Math.PI/2
      add(new THREE.CylinderGeometry(.6,.72,.18,10),0xb18f5e,0,.24,0)
    }else if(type==='castle'){
      add(new THREE.BoxGeometry(2.4,1.55,1.85),0xb7b3a8,0,.88,0);[-.95,.95].forEach(x=>{add(new THREE.CylinderGeometry(.42,.5,2.25,8),0xa39d92,x,1.22,0);add(new THREE.ConeGeometry(.58,.7,6),0x6e91ad,x,2.7,0)})
    }else if(type==='cottage'){
      add(new THREE.CylinderGeometry(.94,1.08,1.28,8),0xe0bd78,0,.72,0);add(new THREE.ConeGeometry(1.32,1.2,7),0xc85b43,0,1.92,0)
    }else if(type==='stable'){
      add(new THREE.BoxGeometry(2.45,.16,1.7),0x9b7b58,0,.16,0);add(new THREE.BoxGeometry(2.25,1.42,.14),0xb18d63,0,.86,-.76);add(new THREE.ConeGeometry(1.72,.76,4),0x6f8fa0,0,1.75,0)
    }else if(type==='storage'){
      add(new THREE.CylinderGeometry(1.0,1.18,1.38,10),0x9d6a3d,0,.78,0);const fill=add(new THREE.SphereGeometry(.92,10,7),0xe568d3,0,1.42,0);fill.scale.y=.55
    }else if(type==='farm'){
      add(new THREE.BoxGeometry(2.5,.13,1.9),0x887052,0,.14,0);for(let i=0;i<5;i++)add(new THREE.ConeGeometry(.1,.52,5),i%2?0x7ea459:0xd2ba4d,-.85+i*.42,.46,-.18)
    }else if(type==='windmill'){
      add(new THREE.CylinderGeometry(.7,1.03,2.65,8),0xe0ba58,0,1.47,0);add(new THREE.ConeGeometry(1.03,1.14,6),0x386ba3,0,3.3,0);for(let i=0;i<4;i++){const blade=add(new THREE.BoxGeometry(.18,1.22,.08),i%2?0xf1ca50:0x4d80b8,0,2.26,.73);blade.rotation.z=-i*Math.PI/2;blade.position.set(Math.sin(i*Math.PI/2)*.5,2.26+Math.cos(i*Math.PI/2)*.5,.73)}
    }else if(type==='well'){
      add(new THREE.CylinderGeometry(.8,.96,.55,10),0xb9b4a8,0,.42,0);add(new THREE.ConeGeometry(1.18,.72,4),0x7a94a7,0,1.75,0)
    }else if(type==='market'){
      add(new THREE.BoxGeometry(2.15,.55,1.05),0x8b674b,0,.53,0);add(new THREE.ConeGeometry(1.6,.54,4),0x718fa3,0,1.84,0)
    }else if(type==='trainingyard'){
      add(new THREE.CylinderGeometry(1.52,1.52,.12,12),0xbda978,0,.12,0);for(let i=0;i<4;i++)add(new THREE.CylinderGeometry(.07,.09,1.08,5),0x765139,Math.cos(i*Math.PI/2)*1.15,.62,Math.sin(i*Math.PI/2)*1.15)
    }else if(type==='campfire'){
      add(new THREE.CylinderGeometry(.68,.82,.12,10),0x5b554c,0,.12,0);add(new THREE.ConeGeometry(.42,.9,6),0xe85c2e,0,.58,0);add(new THREE.ConeGeometry(.18,.57,6),0xffdc63,0,.72,0)
    }else if(type==='signpost'){
      add(new THREE.CylinderGeometry(.06,.09,1.45,6),0x755038,0,.78,0);const arm=add(new THREE.BoxGeometry(1.1,.25,.1),0xceb16c,.28,1.2,0);arm.rotation.y=.2
    }else{
      add(new THREE.CylinderGeometry(.045,.06,1.5,6),0x5e4b3b,0,.8,0);add(new THREE.OctahedronGeometry(.18),0xf2d77b,0,1.57,0)
    }
    monument.rotation.y=-.36; renderer.render(scene,camera)
    return () => { monument.traverse((node) => { if(node instanceof THREE.Mesh){node.geometry.dispose();const materials=Array.isArray(node.material)?node.material:[node.material];materials.forEach(material=>material.dispose())} }); renderer.dispose(); renderer.domElement.remove() }
  },[type,isVisible])
  return <span ref={hostRef} className="kh-builder-preview kh-builder-preview-3d" aria-hidden="true" />
}
