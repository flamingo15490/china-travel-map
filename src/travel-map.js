/** Mount an SVG province map. No framework, remote SDK, or user photos required. */
export function createTravelMap(container,{regions,visited=[],onSelect=()=>{},maxZoom=12}={}){
  if(!(container instanceof Element))throw new TypeError('A map container is required');
  if(container.dataset.mapMounted)throw new Error('Map already mounted');
  if(!Array.isArray(regions)||!regions.length)throw new TypeError('regions is required');
  if(!Number.isFinite(maxZoom)||maxZoom<1)throw new RangeError('maxZoom must be >= 1');
  const svg=container.querySelector('[data-map-svg]'),viewport=container.querySelector('[data-map-viewport]');
  if(!svg||!viewport)throw new Error('Missing SVG: use the generated atlas.svg');
  if(typeof onSelect!=='function')throw new TypeError('onSelect must be a function');
  const regionById=new Map(regions.map(r=>[r.id,r]));
  if(regionById.size!==regions.length)throw new Error('Duplicate province IDs');
  for(const id of visited)if(!regionById.has(id))throw new RangeError('Unknown visited province: '+id);
  const paths=[...svg.querySelectorAll('[data-region]')],labels=[...svg.querySelectorAll('[data-label-region]')];
  if(paths.some(path=>!regionById.has(path.dataset.region)))throw new Error('SVG and regions do not match');
  const lifetime=new AbortController(),signal=lifetime.signal;
  const listen=(target,event,handler,options={})=>target.addEventListener(event,handler,{...options,signal});
  const control=action=>container.querySelector(`[data-map-action="${action}"]`);
  const shell=container.querySelector('[data-map-shell]')||container;
  const tooltip=container.querySelector('[data-map-tooltip]');
  const status=container.querySelector('[data-map-status]');
  let selected='',visitedIds=new Set(),transform={x:0,y:0,k:1},gesture=null,dragged=false,destroyed=false;
  const pointers=new Map();
  const compact=()=>window.matchMedia('(max-width:700px), (pointer:coarse)').matches;
  const live=()=>{if(destroyed)throw new Error('Map has been destroyed');};
  function validateId(id){if(id!==''&&!regionById.has(id))throw new RangeError('Unknown province: '+id);}
  function paint(){
    for(const path of paths){
      const id=path.dataset.region,active=id===selected;
      path.classList.toggle('has-travel',visitedIds.has(id));path.classList.toggle('is-selected',active);
      path.setAttribute('aria-pressed',String(active));
    }
    for(const label of labels){label.classList.toggle('has-travel',visitedIds.has(label.dataset.labelRegion));label.classList.toggle('is-selected',label.dataset.labelRegion===selected);}
  }
  function selectProvince(id,{toggle=false}={}){
    live();validateId(id);selected=toggle&&selected===id?'':id;paint();
    onSelect({selectedId:selected,province:regionById.get(selected)||null,visited:visitedIds.has(selected)});
    return selected;
  }
  function setVisited(ids){
    live();const next=new Set(ids);for(const id of next)validateId(id);next.delete('');visitedIds=next;paint();
  }
  function applyTransform(){
    viewport.setAttribute('transform',`translate(${transform.x} ${transform.y}) scale(${transform.k})`);
    svg.dataset.zoom=transform.k.toFixed(2);svg.classList.toggle('is-detailed',transform.k>2);
    for(const label of labels)label.setAttribute('transform',`translate(${label.dataset.labelX} ${label.dataset.labelY}) scale(${1/transform.k})`);
    if(control('zoom-out'))control('zoom-out').disabled=transform.k<=1;
    if(control('zoom-in'))control('zoom-in').disabled=transform.k>=maxZoom;
  }
  function resetView(){live();transform={x:0,y:0,k:1};applyTransform();}
  function zoom(factor,anchor={x:500,y:400}){
    live();const k=Math.max(1,Math.min(maxZoom,transform.k*factor));
    if(k===1){resetView();return;}
    const ratio=k/transform.k;transform={x:anchor.x-(anchor.x-transform.x)*ratio,y:anchor.y-(anchor.y-transform.y)*ratio,k};applyTransform();
  }
  function svgPoint(event){const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());return {x:p.x,y:p.y};}
  function endPointer(event){pointers.delete(event.pointerId);gesture=null;svg.classList.remove('is-dragging');}
  // Mobile touch belongs to the page. Never capture or prevent its scrolling.
  listen(svg,'pointerdown',event=>{
    if(event.button>0)return;
    dragged=false;
    if(event.pointerType==='touch'||compact())return;
    const point=svgPoint(event);pointers.set(event.pointerId,point);gesture={point,start:{...transform}};
  });
  listen(svg,'pointermove',event=>{
    if(event.pointerType==='touch'||compact()||!pointers.has(event.pointerId)||!gesture)return;
    const point=svgPoint(event),dx=point.x-gesture.point.x,dy=point.y-gesture.point.y;
    if(Math.hypot(dx,dy)>4)dragged=true;
    if(dragged){svg.setPointerCapture(event.pointerId);transform={...gesture.start,x:gesture.start.x+dx,y:gesture.start.y+dy};if(tooltip)tooltip.hidden=true;svg.classList.add('is-dragging');applyTransform();}
  });
  listen(svg,'pointerup',endPointer);listen(svg,'pointercancel',endPointer);
  listen(svg,'pointerleave',event=>{if(!svg.hasPointerCapture(event.pointerId))endPointer(event);});
  for(const path of paths){
    listen(path,'click',()=>{if(!dragged)selectProvince(path.dataset.region,{toggle:true});});
    listen(path,'keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();selectProvince(path.dataset.region,{toggle:true});}});
    listen(path,'pointerenter',()=>{if(tooltip){tooltip.textContent=regionById.get(path.dataset.region).name;tooltip.hidden=false;}});
    listen(path,'pointerleave',()=>{if(tooltip)tooltip.hidden=true;});
  }
  listen(svg,'wheel',event=>{if(!event.ctrlKey||compact())return;event.preventDefault();zoom(Math.exp(-event.deltaY*.003),svgPoint(event));},{passive:false});
  listen(svg,'keydown',event=>{
    if(event.target!==svg)return;
    if(['+','=','-','Home','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))event.preventDefault();
    if(event.key==='+'||event.key==='=')zoom(1.5);
    if(event.key==='-')zoom(1/1.5);
    if(event.key==='Home')resetView();
    const delta={ArrowLeft:[50,0],ArrowRight:[-50,0],ArrowUp:[0,50],ArrowDown:[0,-50]}[event.key];
    if(delta&&!compact()){transform.x+=delta[0];transform.y+=delta[1];applyTransform();}
  });
  if(control('overview'))listen(control('overview'),'click',resetView);
  if(control('zoom-in'))listen(control('zoom-in'),'click',()=>zoom(1.5));
  if(control('zoom-out'))listen(control('zoom-out'),'click',()=>zoom(1/1.5));
  if(control('expand'))listen(control('expand'),'click',async()=>{
    try{if(document.fullscreenElement===shell)await document.exitFullscreen();else await shell.requestFullscreen();}
    catch{if(status)status.textContent='当前浏览器暂不支持展开地图。';}
  });
  listen(document,'fullscreenchange',()=>{if(control('expand'))control('expand').setAttribute('aria-label',document.fullscreenElement===shell?'收起地图':'展开地图');});
  function resize(){
    svg.setAttribute('viewBox',shell.clientWidth<560?'175 0 650 800':'0 0 1000 800');
    svg.setAttribute('aria-label',compact()?'中国省份地图，点击省份选择，使用按钮缩放；滑动滚动页面':'中国省份地图，支持鼠标拖动、缩放和省份选择');
    if(compact()){pointers.clear();gesture=null;dragged=false;svg.classList.remove('is-dragging');}
  }
  // Validate before registering the instance as mounted.
  setVisited(visited);container.dataset.mapMounted='true';resetView();resize();
  const observer=new ResizeObserver(resize);observer.observe(shell);listen(window,'resize',resize);
  function destroy(){
    if(destroyed)return;
    lifetime.abort();observer.disconnect();for(const id of pointers.keys())if(svg.hasPointerCapture(id))svg.releasePointerCapture(id);pointers.clear();gesture=null;destroyed=true;
    delete container.dataset.mapMounted;svg.classList.remove('is-dragging');if(tooltip)tooltip.hidden=true;
  }
  return {selectProvince,setVisited,resetView,zoomIn:()=>zoom(1.5),zoomOut:()=>zoom(1/1.5),getSelectedProvince:()=>regionById.get(selected)||null,destroy};
}
