# 地图数据来源

- 官方公开可视化页面：https://cloudcenter.tianditu.gov.cn/administrativeDivision/
- 省级边界接口：https://cloudcenter.tianditu.gov.cn/api/portal/region/map?gb=156000000&level=2
- 本地原文件：data/china-provinces.geojson
- SHA256：aebcd73acc1bae5ca7161a5cd87b2c61e0387984c959a2c84c237e33f161f613
- 初次取数时官方可视化页面标注数据时间为2025年9月；本次从原博客已核对版本抽出，不宣称已刷新为最新行政区划。

原文件含34个省级MultiPolygon与8个MultiLineString境界线要素。构建使用全部面环和线坐标，采用Albers投影（标准纬线25°/47°，中央经线105°），保留台湾、海岛及海上境界线，不简化原始几何。省名和省级代码直接来自要素properties，不额外下载城市或区县数据。

地图数据属于第三方来源，**不在本仓库代码的MIT授权范围内**。请遵守来源方的使用条件及适用的地图展示要求。本仓库不重新授予数据权利、不把公开访问解释为无条件开放许可，也不把源数据的来源或其他地图审图号当作本次自定义成图独立审核的证明。

当前图面保留来源链接；若在自己的产品中使用，也应保留出处。sources.json记录来源和固定校验值；脚本拒绝未核对的边界文件。

代码抽取基线：https://github.com/flamingo15490/flamingo15490.github.io/tree/4c37249a0e82588813afe744c4041a234fbfa80a 。新仓库使用独立Git历史，不包含原博客的个人资料、照片或密码相册。
