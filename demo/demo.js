import {createTravelMap} from './travel-map.js';
const response=await fetch('./regions.json');
if(!response.ok)throw new Error('Unable to load local province names');
const regions=await response.json();
// Demonstration data, unrelated to any person's real travel history.
const visited=['156330000','156510000','156440000'];
const options=document.getElementById('province-options');
const map=createTravelMap(document.getElementById('example-map'),{
  regions,visited,
  onSelect({selectedId,province,visited}){
    document.getElementById('selected-name').textContent=province?province.name:'点击一个省份';
    document.getElementById('selected-description').textContent=province?`省级代码：${selectedId} · ${visited?'该省份在演示高亮列表中':'该省份未设置演示高亮'}。可用这个选择结果筛选自己的内容。`:'再次点击同一省份取消选择。选择结果可接入自己的照片、文章或其他内容。';
    for(const button of options.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.province===selectedId));
  }
});
for(const id of visited){
  const region=regions.find(r=>r.id===id),button=document.createElement('button');
  button.type='button';button.dataset.province=id;button.textContent=region.name;button.setAttribute('aria-pressed','false');
  button.addEventListener('click',()=>map.selectProvince(id,{toggle:true}));options.append(button);
}
const clear=document.createElement('button');clear.type='button';clear.textContent='清除选择';clear.addEventListener('click',()=>map.selectProvince(''));options.append(clear);
