# China Travel Map · 中国省份互动地图

从[告木博客](https://flamingo15490.github.io/gallery.html)画廊抽出的独立地图组件。纯 SVG + 原生 JavaScript/CSS，不依赖前端框架、在线地图 SDK 或地图 Key。

## 功能

- 34个省级行政区，已设置的省份高亮；点击省份选择，再次点击取消。
- 使用 `onSelect` 回调接入自己的照片、文章或其他内容。
- 放大、缩小、全国总览、全屏；桌面鼠标拖动与 Ctrl + 滚轮缩放。
- 手机和触摸设备的滑动交给页面滚动，地图不抢手势；使用按钮缩放。
- Tab / Enter / Space 操作省份，地图聚焦时支持 + / − / Home；桌面支持方向键平移。
- 事件与选择器限定在实例容器内，支持销毁与多个实例；样式变量可覆盖。

示例仅使用浙江、四川、广东三个**演示高亮**，不包含个人照片、密码、联系方式或真实旅行记录。

## 运行示例

需要 Python 3.10+，仅使用标准库，无须安装第三方 Python 包。

```sh
python scripts/build_demo.py
python -m http.server 8767 --directory dist
```

打开 http://localhost:8767/ 。不要直接双击HTML文件，示例会读取同目录的 `regions.json`。

输出目录包含可独立部署的 `index.html`、`atlas.svg`、`regions.json`、组件JS/CSS及示例脚本。资源地址为相对路径，可部署在子目录。构建后浏览器仅请求本站文件，不访问地图服务。

```sh
python scripts/build_demo.py --out /path/to/output
```

## 接入自己的页面

复制构建后的 `atlas.svg`、`regions.json`、`travel-map.js`、`travel-map.css`。下面的SVG来自本仓库构建后的可信本地文件，不应替换成未经核对的用户输入。

```html
<link rel="stylesheet" href="./travel-map.css">
<section class="travel-map" id="my-map"></section>
<script type="module">
  import {createTravelMap} from './travel-map.js';
  const [svg, regions] = await Promise.all([
    fetch('./atlas.svg').then(r => r.text()),
    fetch('./regions.json').then(r => r.json())
  ]);
  const container = document.getElementById('my-map');
  container.innerHTML = `<div data-map-shell>${svg}
    <div class="map-actions">
      <button data-map-action="overview" aria-label="全国总览">⌂</button>
      <button data-map-action="zoom-in" aria-label="放大地图">＋</button>
      <button data-map-action="zoom-out" aria-label="缩小地图">−</button>
    </div></div>`;
  const map = createTravelMap(container, {
    regions,
    visited: ['156330000'],
    onSelect({selectedId, province, visited}) {
      // selectedId为空字符串表示已取消选择。
      // 在这里根据省级代码筛选自己的相册。
      console.log(selectedId, province?.name, visited);
    }
  });
</script>
```

省级代码使用来源数据中的完整 `gb`，例如浙江为 `156330000`，不是六位简写 `330000`。完整代码与名称见生成的 `regions.json`。

| 接口 | 用途 |
|---|---|
| `createTravelMap(container, options)` | 初始化，返回地图实例 |
| `options.regions` | 必填，生成的省级代码与名称数组 |
| `options.visited` | 需要高亮的省级代码数组，默认空 |
| `options.onSelect(result)` | 选择变化时调用，包含 selectedId、province、visited |
| `options.maxZoom` | 最大缩放倍数，默认12 |
| `map.selectProvince(id, {toggle:false})` | 选择省份；传空字符串取消；toggle为true时重复选择取消 |
| `map.setVisited(ids)` | 替换高亮列表，不改变当前选择 |
| `map.zoomIn()` / `map.zoomOut()` | 通过按钮或外部UI缩放 |
| `map.resetView()` | 恢复全国视图，保留当前省份选择 |
| `map.getSelectedProvince()` | 获取当前省份对象或null |
| `map.destroy()` | 清理事件、观察器和拖动捕获；保留静态SVG |

组件控制按钮、悬浮提示、状态文字都通过 `data-map-*` 属性识别，均为可选。完整示例见 `demo/index.template.html` 与 `demo/demo.js`。

```css
.travel-map {
  --map-bg: #f1f3ed;
  --map-land: #e4eadb;
  --map-visited: #9cb886;
  --map-selected: #587a49;
  --map-ink: #38572d;
}
```

## 文件结构

| 路径 | 内容 |
|---|---|
| `src/travel-map.js` | 可复用互动组件 |
| `src/travel-map.css` | 容器内作用域样式 |
| `scripts/render_svg.py` | 校验边界、投影并生成SVG |
| `scripts/build_demo.py` | 构建独立静态示例 |
| `demo/` | 演示页面、样式和回调接入 |
| `data/china-provinces.geojson` | 已核对的第三方地图来源文件 |
| `sources.json` / `DATA_SOURCES.md` | 来源、原文件校验值与使用边界 |
| `tests/` | 边界完整性及构建检查 |

## 验证

```sh
python -m unittest discover -s tests -v
python scripts/build_demo.py
node --check src/travel-map.js
node --check demo/demo.js
```

Node只用于语法检查，不是构建或运行页面所必需的依赖。GitHub Actions自动运行以上检查。

## 授权与地图来源

原创组件、脚本和示例代码使用 [MIT License](LICENSE)。**第三方地图数据不包含在MIT授权范围内**；本仓库不对这些数据授予额外权利。来源、校验值和展示边界见 [DATA_SOURCES.md](DATA_SOURCES.md)。

原始边界参与完整SVG生成，不抽稀坐标、不删除海岛或境界线。数据来自官方行政区划可视化来源，不等于本项目自定义成图已经独立取得审图结论；项目不冒用审图号。
