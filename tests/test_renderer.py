from pathlib import Path
from tempfile import TemporaryDirectory
import hashlib,json,re,sys,unittest,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from scripts.render_svg import render_atlas
from scripts.build_demo import build

class AtlasChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config=json.loads((ROOT/'sources.json').read_text(encoding='utf-8'))
        cls.source=json.loads((ROOT/cls.config['file']).read_text(encoding='utf-8'))
        cls.svg,cls.regions=render_atlas(ROOT,cls.config)
    def test_all_provinces_boundaries_and_coordinate_vertices_are_retained(self):
        doc=ET.fromstring(self.svg)
        provinces=[p for p in (node for node in doc.iter() if node.tag.rsplit('}',1)[-1]=='path') if 'data-region' in p.attrib]
        boundaries=[p for p in (node for node in doc.iter() if node.tag.rsplit('}',1)[-1]=='path') if 'data-boundary' in p.attrib]
        self.assertEqual(len(provinces),34);self.assertEqual(len(boundaries),8)
        self.assertEqual({p['id'] for p in self.regions},{p['properties']['gb'] for p in self.source['features'] if p['geometry']['type']=='MultiPolygon'})
        self.assertIn({'id':'156710000','name':'台湾省'},self.regions)
        def count(coords):
            if isinstance(coords[0],(float,int)):return 1
            return sum(count(child) for child in coords)
        expected=sum(count(f['geometry']['coordinates']) for f in self.source['features'])
        actual=sum(len(re.findall(r'[ML]',p.attrib['d'])) for p in provinces+boundaries)
        self.assertEqual(actual,expected)
    def test_changed_boundary_file_is_rejected(self):
        with TemporaryDirectory(prefix='travel-map-test-') as directory:
            root=Path(directory).resolve();(root/'map.geojson').write_bytes(b'{"features":[]}')
            with self.assertRaises(AssertionError):render_atlas(root,{'file':'map.geojson','sha256':self.config['sha256']})
    def test_demo_build_is_self_contained_and_relative(self):
        with TemporaryDirectory(prefix='travel-map-demo-') as directory:
            out=build(Path(directory)/'dist')
            expected={'index.html','atlas.svg','regions.json','travel-map.js','travel-map.css','demo.js','demo.css'}
            self.assertEqual({p.name for p in out.iterdir()},expected)
            page=(out/'index.html').read_text(encoding='utf-8')
            self.assertNotIn('<!-- MAP_SVG -->',page)
            self.assertIn('src="./demo.js"',page)
            self.assertNotIn('mp.weixin',page)
            self.assertNotIn('private-gallery',page)
            self.assertEqual(len(json.loads((out/'regions.json').read_text(encoding='utf-8'))),34)

if __name__=='__main__':unittest.main()
