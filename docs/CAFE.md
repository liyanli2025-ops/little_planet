# 海风来信 · 公共海岛咖啡馆

入口：左上角「阿球」星球菜单 →「海边咖啡馆」。已登录但未配对的账号也可以进入。

## 本版功能

- 扩大为不规则曲线平面，带内凹入口和椭圆天窗；室内增加木地板、编织地毯、扶手软椅、书架、唱片机、明信片、陶杯、布帘和串灯。独立海岛和玻璃咖啡馆：深木吧台、窗边双人桌、主理人熊、双层甜品柜、海面、植物、夜间暖光和雨天。
- 拖动旋转，滚轮或双指缩放；双指平移。镜头俯仰不会翻到地板下面；点单和甜品切换到相应近景。
- 同场陌生访客约每 750 毫秒同步；每个场景最多 8 位，满员自动进入另一个场景。优先跟随已在咖啡馆的配对对象。
- 16 个座位（10 个双人桌座位、3 个窗内面海单人位、3 个露台单人位），由服务器确认占用。点击座位后走过去坐下；点击地面离座。坐姿复用现有熊模型的座椅姿势。
- 3 种咖啡、3 种鸡尾酒、6 种甜品，均免费。堂食短暂制作后出现于手上或座位前；「带走」直接保存到自己的冰箱。
- 标准服装、配色、剪裁、头饰在公共场景中同步。历史外部生成的私有附件模型不公开给陌生人。

室外增加圆角木露台、面海长桌、遮阳架、栏杆和串灯，以及沙滩遮阳伞、礁石、栈桥、球面海浪与帆船。海岛按钮展示完整星球，露台按钮看室外近景；室内剖视时收起遮阳架顶部，避免遮住窗边座位。单人位从背后入座与离座，经入口通道来往露台。

## 时间、天气与数据

时间由服务器提供，按北京时间显示。海岛天气是所有访客共享的**虚拟天气**，不是北京的实况气象数据；按统一三小时时段变化，白天、日落、夜间由同一时钟驱动。

公共访客和座位属于临时在线状态，离开或失联 20 秒后释放，服务重启后重新入场。前端刷新后可以重新进入。公共访客数据只包含显示名、熊外观、位置、座位与当前堂食，不包含私人星球存档、手账或地理位置。

带走物品及订单回执保存在现有 SQLite 数据库中。物品入库与回执写入同一事务；同一订单编号重试不会重复发放。冰箱满时订单不会成功，也不会留下已完成回执。回执在服务重启后继续有效。

家庭场景在咖啡馆开启时暂停渲染和自动睡眠；自己的熊不同时出现在家庭在线位置。返回后恢复。手机后台页面暂停轮询，回来会重新连接。

## 资源

甜品：Tiny Treats Baked Goods 1.0，Isa Lousberg，CC0。九个 GLB（六款陈列、三份切片）合计约 0.5 MB；许可和原始文件映射保存在 `dist/assets/cafe-desserts/`。植物复用已接入的 Tiny Treats House Plants。

## 验证

`node --test tests/cafe.test.mjs` 验证座位占用、陌生人公共状态、失联释放、订单去重、失败回滚、准备时间和统一时钟。

浏览器集成测试使用临时数据库与两个未配对账号，检查实际点击入座、同桌、堂食、重复请求只入库一份、手机甜品近景、夜雨画面、离开释放及控制台错误。浏览器测试在本地 Chromium 完成；真实 iPhone 的帧率和多于两位访客的渲染性能仍需要线上设备验证。

## 海岸与窗湾更新

沙滩从咖啡馆平台向球面海岸延伸，包含渐变湿沙、礁石和沙丘植物。海面使用随时间变化的细波法线与反光；三道浅水/泡沫带沿不规则岸线推进再退回。三只海豚按不同周期跃出、翻身、落水，配有涟漪和水滴；不需要额外点击。

室内三个单人位移到左侧弧形窗湾，长桌沿窗弯曲，每把椅子朝向对应海面，离座回到椅背后的通道。右侧室外露台保持原位，两排不再前后遮挡。窗湾第二个座位在默认视角可能被前座遮挡，可拖动旋转看清后点击；命中区域已缩小到座椅本体。

动画以本地渲染时间驱动，天气和访客仍使用服务器共享状态。手机实体设备帧率尚未验证。


## Spherical coast and imported assets (2026-10-04)

The coastline is an angular contour on the radius-17.8 ocean sphere. The sand shell stays within 4.5 cm of the ocean radius everywhere. Timber piles support the level cafe deck without raising the sand into a hill; the broad beach continues to the sides of the planet. Wet sand, shallow-water coloring and surf use the same contour. Sea ripples use a lightweight animated material, not a physical fluid simulation.

Selected assets live under `dist/assets/coast/`: Akshat’s skinned Dolphin Animated (with its existing swim clip plus runtime breaching trajectory and splash), two palm meshes extracted from Jefbud’s beach scene, seven Quaternius rock/grass/bush/fern models, and resized Poly Haven sand color/height maps. Source credits and modification notices are accessible through the cafe’s discreet attribution link. The OBJ animals were not imported because that archive contains no animation. Sand remains scenery: this change does not extend the multiplayer walking bounds into the beach or sea.

Validation: coast geometry joins the ocean sphere at 360 sampled angles; sand radial deviation stays below 4.5 cm across the cap; all glTF dependencies are local; optimized palm buffer bounds checked. Browser QA uses Chrome/Playwright (Browser plugin not available): desktop/mobile render, 20 animation samples, console errors, plus existing two-visitor seating/order/takeaway regression. Physical-phone frame rate has not been measured.

Roundness correction: removed the raised foundation blend and floating legacy trees/stepping stones; added supported entrance steps. Rotation screenshots verify the outline from multiple bearings.
