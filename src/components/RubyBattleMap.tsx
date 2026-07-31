import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const material = (color:number, emissive=0) => new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: emissive ? .42 : 0, roughness:.8, flatShading:true })

export const RubyBattleMap = ({ onBack }: { onBack: () => void }) => {
  const mountRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const host=mountRef.current;if(!host)return
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x4b2033);scene.fog=new THREE.Fog(0x4b2033,30,74)
    const camera=new THREE.OrthographicCamera(-24,24,13.5,-13.5,.1,120);camera.position.set(24,29,27);camera.lookAt(0,0,0)
    const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement)
    scene.add(new THREE.HemisphereLight(0xffd1ca,0x351526,2.2));const sun=new THREE.DirectionalLight(0xffb4a8,2.45);sun.position.set(-18,29,15);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-28;sun.shadow.camera.right=28;sun.shadow.camera.top=28;sun.shadow.camera.bottom=-28;scene.add(sun)
    const world=new THREE.Group();scene.add(world)
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(130,100),material(0x562332));ground.rotation.x=-Math.PI/2;ground.position.y=-.05;ground.receiveShadow=true;world.add(ground)
    const plateau=new THREE.Mesh(new THREE.CircleGeometry(27,48),material(0x903546));plateau.rotation.x=-Math.PI/2;plateau.scale.z=.76;plateau.position.y=.01;plateau.receiveShadow=true;world.add(plateau)
    const pathMat=material(0x4a2634)
    const path=(x:number,z:number,w:number,d:number,rotation=0)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w,d),pathMat);p.rotation.x=-Math.PI/2;p.rotation.z=rotation;p.position.set(x,.05,z);p.receiveShadow=true;world.add(p)}
    path(0,0,8,33,0);path(0,0,30,6,Math.PI/2);path(-10,-9,5,18,-.35);path(11,9,5,19,-.45)
    const roadHub=new THREE.Mesh(new THREE.CircleGeometry(5.5,30),pathMat);roadHub.rotation.x=-Math.PI/2;roadHub.position.y=.06;world.add(roadHub)
    const crystalPulse:THREE.Mesh[]=[]
    const crystal=(x:number,z:number,scale=1,color=0xef334c)=>{const group=new THREE.Group();group.position.set(x,.18,z);group.scale.setScalar(scale);world.add(group);for(let i=0;i<3;i++){const a=i*2.1;const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.5+i*.12,0),material(color,color));gem.position.set(Math.cos(a)*(.5+i*.11),.55+i*.16,Math.sin(a)*(.5+i*.11));gem.scale.y=1.9;gem.rotation.y=a*.7;gem.castShadow=true;group.add(gem);crystalPulse.push(gem)}const base=new THREE.Mesh(new THREE.CylinderGeometry(.8,1.05,.3,7),material(0x562b38));base.position.y=.15;group.add(base)}
    ;[[-17,-8,1.2],[-18,8,1.05],[-11,14,.85],[15,-9,1.15],[18,6,.9],[7,16,.75],[-5,-15,.9],[14,13,.85],[-20,-1,.8]].forEach(([x,z,s])=>crystal(x,z,s))
    const addPalaceTower=(x:number,z:number,height:number)=>{const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.08,1.2,height,8),material(0xa6424e));tower.position.set(x,height/2+.35,z);tower.castShadow=true;world.add(tower);const roof=new THREE.Mesh(new THREE.ConeGeometry(1.35,1.75,6),material(0x6f1d38));roof.position.set(x,height+1.2,z);roof.castShadow=true;world.add(roof);const ring=new THREE.Mesh(new THREE.TorusGeometry(1.13,.1,5,8),material(0xf2bd63));ring.rotation.x=Math.PI/2;ring.position.set(x,height+.2,z);world.add(ring)}
    const palaceBase=new THREE.Mesh(new THREE.CylinderGeometry(4.7,5.05,1.05,9),material(0x582f3b));palaceBase.position.y=.53;palaceBase.castShadow=true;world.add(palaceBase)
    const keep=new THREE.Mesh(new THREE.BoxGeometry(4.4,4.6,3.9),material(0xb14854));keep.position.set(0,2.65,.3);keep.castShadow=true;world.add(keep)
    const gate=new THREE.Mesh(new THREE.BoxGeometry(1.1,1.75,.08),material(0x401e2d));gate.position.set(0,1.25,2.3);world.add(gate)
    ;[-1.25,0,1.25].forEach((x)=>{const window=new THREE.Mesh(new THREE.CircleGeometry(.21,7),material(0xffcf6d,0xffcf6d));window.position.set(x,3.2,2.27);world.add(window)})
    addPalaceTower(-3.1,-2.85,4.3);addPalaceTower(3.1,-2.85,4.3);addPalaceTower(-3.1,2.85,4);addPalaceTower(3.1,2.85,4)
    const royalRuby=new THREE.Mesh(new THREE.OctahedronGeometry(1.05,0),material(0xff3657,0xff3657));royalRuby.position.set(0,6.25,.3);royalRuby.scale.y=1.6;royalRuby.castShadow=true;world.add(royalRuby);crystalPulse.push(royalRuby)
    const addOutpost=(x:number,z:number,roof:number)=>{const base=new THREE.Mesh(new THREE.CylinderGeometry(1.23,1.4,1.5,7),material(0x9b404c));base.position.set(x,1.1,z);base.castShadow=true;world.add(base);const roofMesh=new THREE.Mesh(new THREE.ConeGeometry(1.65,1.5,6),material(roof));roofMesh.position.set(x,2.65,z);roofMesh.castShadow=true;world.add(roofMesh);const banner=new THREE.Mesh(new THREE.PlaneGeometry(.62,.95),new THREE.MeshBasicMaterial({color:0xf4bb59,side:THREE.DoubleSide}));banner.position.set(x+.1,4.15,z);world.add(banner)}
    ;[[-12,6,0x6a203a],[11,-6,0x74223d],[-9,-12,0x80283f],[13,10,0x67203a]].forEach(([x,z,roof])=>addOutpost(x,z,roof))
    for(let i=0;i<45;i++){const a=i*2.4,r=17+(i%5)*2.4;const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.25+(i%4)*.09,0),material(i%4?0x6c2e3d:0xd84b59));rock.position.set(Math.cos(a)*r,.2,Math.sin(a)*r*.72);rock.rotation.y=i;world.add(rock)}
    const resize=()=>{const {width,height}=host.getBoundingClientRect(),half=13.5,aspect=width/height;camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;renderer.setSize(width,height,false);camera.updateProjectionMatrix()};resize();window.addEventListener('resize',resize)
    let pointerX=0,pointerY=0,yaw=Math.atan2(27,24),height=29,frame=0
    const move=(event:PointerEvent)=>{const rect=host.getBoundingClientRect();pointerX=(event.clientX-rect.left)/rect.width-.5;pointerY=(event.clientY-rect.top)/rect.height-.5};host.addEventListener('pointermove',move)
    const animate=()=>{frame=requestAnimationFrame(animate);const time=performance.now()*.001;yaw+=((Math.atan2(27,24)+pointerX*.55)-yaw)*.05;height+=((29-pointerY*6)-height)*.05;camera.position.set(Math.cos(yaw)*35,height,Math.sin(yaw)*35);camera.lookAt(0,.8,0);world.rotation.y=Math.sin(time*.16)*.007;crystalPulse.forEach((gem,index)=>{const pulse=1+Math.sin(time*2.5+index)*.08;gem.scale.set(pulse,gem===royalRuby?1.6*pulse:1.9*pulse,pulse)});renderer.render(scene,camera)};animate()
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);host.removeEventListener('pointermove',move);renderer.dispose();host.removeChild(renderer.domElement)}
  },[])
  return <section className="ruby-battle-map" aria-label="Empress Ruby battle map"><div ref={mountRef} className="ruby-battle-canvas" /><header><span>EMPERESS RUBY'S DOMAIN</span><b>CRIMSON JEWEL KINGDOM</b></header><button onClick={onBack}>‹ <span>RETREAT</span></button></section>
}
