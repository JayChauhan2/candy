import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export type BuilderMonument = 'house' | 'station1' | 'station2' | 'station3' | 'station4' | 'station5' | 'station6' | 'station7' | 'station8' | 'station9' | 'station10' | 'watchtower' | 'guildhall' | 'fountain' | 'forge' | 'garden' | 'bannerpost' | 'castle' | 'cottage' | 'stable' | 'storage' | 'farm' | 'windmill' | 'well' | 'market' | 'trainingyard' | 'campfire' | 'signpost' | 'lantern'

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
    }else if(type.startsWith('station')){
      const variant=Number(type.slice(7)), roofColors=[0x477cb2,0x386ba3,0x5d6fa8,0xd65443,0x527c9c,0x426a91,0x6f8fa0,0x486e9a,0x5b6f9e,0x315f99], woodColors=[0x8c6745,0x765139,0x9b704b,0x704929,0x916f50,0x79543c,0x9b7b58,0x6f5848,0x755038,0x826048], height=2.25+(variant%4)*.35, deck=2.15+(variant%3)*.22
      add(new THREE.CylinderGeometry(1.32,1.62,.48,8),0x777a74,0,.32,0)
      ;[[-.86,-.6],[.86,-.6],[-.86,.6],[.86,.6]].forEach(([x,z])=>add(new THREE.CylinderGeometry(.09,.12,height,6),woodColors[variant-1],x,.48+height/2,z))
      ;[-1,1].forEach(side=>{const brace=add(new THREE.BoxGeometry(.1,height*.8,.1),woodColors[variant-1],side*.72,.85+height*.36,.64);brace.rotation.z=side*(.45+(variant%3)*.06)})
      add(new THREE.BoxGeometry(deck,.2,1.72),woodColors[variant-1],0,height+.58,0)
      if(variant===4||variant===8){add(new THREE.CylinderGeometry(1.02,1.18,1.32,8),0xa39273,0,height+1.28,0);add(new THREE.ConeGeometry(1.5,.9,6),roofColors[variant-1],0,height+2.35,0)}
      else {add(new THREE.BoxGeometry(1.7+(variant%2)*.3,1.16+(variant%3)*.12,1.35),0x916f50,0,height+1.27,0);add(new THREE.ConeGeometry(1.42+(variant%2)*.16,.9,4),roofColors[variant-1],0,height+2.38,0)}
      if(variant===2||variant===5||variant===7){add(new THREE.BoxGeometry(.92,.12,1.05),woodColors[variant-1],-1.35,height+.76,0)}
      if(variant===6||variant===9){add(new THREE.ConeGeometry(.28,.7,6),0xe85c2e,.45,height+1.05,.86)}
      const pole=add(new THREE.CylinderGeometry(.05,.06,2.05,6),0x704929,.7,height+3.32,0);const flag=add(new THREE.PlaneGeometry(1.06,.55),roofColors[variant-1],1.24,height+3.86,0);flag.rotation.y=Math.PI/2
    }else if(false && type.startsWith('station')){
      const variant=Number(type.slice(7))
      if(variant===1){add(new THREE.CylinderGeometry(1.45,1.6,.16,10),0x916f50,0,.16,0);add(new THREE.ConeGeometry(1.32,1.42,7),0xd65443,0,1.28,0);add(new THREE.CylinderGeometry(.06,.08,2.4,5),0x765139,1.15,1.28,0)}
      else if(variant===2){add(new THREE.BoxGeometry(2.55,.18,1.85),0x916f50,0,.18,0);add(new THREE.BoxGeometry(2.3,1.6,.18),0xb18d63,0,.96,-.78);add(new THREE.ConeGeometry(1.84,.86,4),0x477cb2,0,2.0,0)}
      else if(variant===3){add(new THREE.CylinderGeometry(1.58,1.58,.12,12),0xbda978,0,.12,0);for(let i=0;i<4;i++)add(new THREE.CylinderGeometry(.08,.1,1.35,5),0x765139,Math.cos(i*Math.PI/2)*1.18,.75,Math.sin(i*Math.PI/2)*1.18)}
      else if(variant===4){add(new THREE.CylinderGeometry(1.65,1.78,.22,9),0x78533b,0,.2,0);for(let i=0;i<8;i++)add(new THREE.CylinderGeometry(.1,.13,1.68,5),0x8c6745,Math.cos(i*Math.PI/4)*1.37,.92,Math.sin(i*Math.PI/4)*1.37);add(new THREE.ConeGeometry(.62,1.12,6),0xd65443,0,1.82,0)}
      else if(variant===5){add(new THREE.CylinderGeometry(.75,.9,2.6,8),0xa39273,0,1.48,0);add(new THREE.ConeGeometry(1.16,1.08,6),0x477cb2,0,3.28,0);add(new THREE.CylinderGeometry(1.3,1.3,.14,10),0x916f50,0,.13,0)}
      else if(variant===6){add(new THREE.BoxGeometry(2.35,.2,1.72),0x716354,0,.18,0);add(new THREE.CylinderGeometry(.92,1.08,1.48,8),0x744447,0,1.0,0);add(new THREE.ConeGeometry(1.35,.88,6),0x3c2a35,0,2.08,0);add(new THREE.SphereGeometry(.35,7,6),0xff9d46,0,.82,1.08)}
      else if(variant===7){add(new THREE.BoxGeometry(2.75,.18,1.9),0x9b7b58,0,.16,0);add(new THREE.BoxGeometry(2.5,1.45,.16),0xb18d63,0,.88,-.82);add(new THREE.ConeGeometry(1.95,.78,4),0x6f8fa0,0,1.88,0);add(new THREE.SphereGeometry(.38,7,6),0x8a5d43,-.72,.68,.18);add(new THREE.SphereGeometry(.38,7,6),0x8a5d43,.72,.68,.18)}
      else if(variant===8){add(new THREE.CylinderGeometry(.82,.96,3.1,8),0xa39d92,0,1.7,0);add(new THREE.ConeGeometry(1.22,1.28,6),0x6e91ad,0,3.9,0);add(new THREE.BoxGeometry(.58,.68,.08),0x71483a,0,1.1,.9)}
      else if(variant===9){add(new THREE.CylinderGeometry(1.3,1.45,.18,10),0x5b554c,0,.16,0);add(new THREE.CylinderGeometry(.9,1.08,1.55,8),0x6d3b3d,0,.98,0);add(new THREE.ConeGeometry(1.36,.9,6),0x3f2631,0,2.15,0);add(new THREE.ConeGeometry(.42,.95,6),0xe85c2e,0,.95,1.08)}
      else {add(new THREE.CylinderGeometry(1.32,1.62,.48,8),0x777a74,0,.32,0);[[-.86,-.58],[.86,-.58],[-.86,.58],[.86,.58]].forEach(([x,z])=>add(new THREE.CylinderGeometry(.09,.12,2.75,6),0x704929,x,1.58,z));[-1,1].forEach(side=>{const brace=add(new THREE.BoxGeometry(.1,2.1,.1),0x765139,side*.72,1.58,.62);brace.rotation.z=side*.55});add(new THREE.BoxGeometry(2.28,.18,1.72),0x8c6745,0,2.95,0);add(new THREE.BoxGeometry(1.78,1.18,1.4),0x916f50,0,3.64,0);add(new THREE.ConeGeometry(1.48,.92,4),0x477cb2,0,4.68,0);const pole=add(new THREE.CylinderGeometry(.05,.06,2.15,6),0x704929,.72,5.45,0);const flag=add(new THREE.PlaneGeometry(1.08,.56),0x477cb2,1.26,6.0,0);flag.rotation.y=Math.PI/2}
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
