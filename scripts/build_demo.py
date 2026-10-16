"""Build a local, offline demo using only Python's standard library."""
from pathlib import Path
import argparse,json,shutil,sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from scripts.render_svg import render_atlas

def build(output):
    output=Path(output).resolve()
    assert output!=ROOT and not ROOT.is_relative_to(output),'Output must be a dedicated directory'
    config=json.loads((ROOT/'sources.json').read_text(encoding='utf-8'))
    svg,regions=render_atlas(ROOT,config)
    template=(ROOT/'demo/index.template.html').read_text(encoding='utf-8')
    output.mkdir(parents=True,exist_ok=True)
    (output/'index.html').write_text(template.replace('<!-- MAP_SVG -->',svg),encoding='utf-8')
    (output/'atlas.svg').write_text(svg,encoding='utf-8')
    (output/'regions.json').write_text(json.dumps(regions,ensure_ascii=False),encoding='utf-8')
    for name,source in [('travel-map.js','src/travel-map.js'),('travel-map.css','src/travel-map.css'),('demo.js','demo/demo.js'),('demo.css','demo/demo.css')]:
        shutil.copyfile(ROOT/source,output/name)
    print(json.dumps({'output':str(output),'provinces':len(regions),'runtime_remote_requests':0},ensure_ascii=False))
    return output
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--out',type=Path,default=ROOT/'dist')
    build(parser.parse_args().out)
