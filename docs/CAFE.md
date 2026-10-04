# 海风来信 · 公共海岛咖啡馆

入口：左上角「阿球」星球菜单 →「海边咖啡馆」。已登录但未配对的账号也可以进入。

## 本版功能

- 扩大为不规则曲线平面，带内凹入口和椭圆天窗；室内增加木地板、编织地毯、扶手软椅、书架、唱片机、明信片、陶杯、布帘和串灯。独立海岛和玻璃咖啡馆：深木吧台、窗边双人桌、主理人熊、双层甜品柜、海面、植物、夜间暖光和雨天。
- 拖动旋转，滚轮或双指缩放；双指平移。镜头俯仰不会翻到地板下面；点单和甜品切换到相应近景。
- 同场陌生访客约每 750 毫秒同步；每个场景最多 8 位，满员自动进入另一个场景。优先跟随已在咖啡馆的配对对象。
- 19 个座位（10 个双人桌座位、3 个窗内面海单人位、3 个露台单人位、3 个吧台位），由服务器确认占用。点击座位后走过去坐下；点击地面离座。坐姿复用现有熊模型的座椅姿势。
- 3 种咖啡、3 种鸡尾酒、6 种甜品，均免费。到吧台点单后，由主理熊准备并留在吧台。点击取餐接过堂食托盘，再自行找座位；打包餐食在领取时保存到自己的冰箱。
- 标准服装、配色、剪裁、头饰在公共场景中同步。历史外部生成的私有附件模型不公开给陌生人。

室外增加圆角木露台、面海长桌、遮阳架、栏杆和串灯，以及沙滩遮阳伞、礁石、栈桥、球面海浪与帆船。海岛按钮展示完整星球，露台按钮看室外近景；室内剖视时收起遮阳架顶部，避免遮住窗边座位。单人位从背后入座与离座，经入口通道来往露台。

## 时间、天气与数据

时间由服务器提供，按北京时间显示。海岛天气是所有访客共享的**虚拟天气**，不是北京的实况气象数据；按统一三小时时段变化，白天、日落、夜间由同一时钟驱动。

公共访客和座位属于临时在线状态，离开或失联 20 秒后释放，服务重启后重新入场。前端刷新后可以重新进入。公共访客数据只包含显示名、熊外观、位置、座位与当前堂食，不包含私人星球存档、手账或地理位置。

带走物品及订单回执保存在现有 SQLite 数据库中。物品入库与回执写入同一事务；同一订单编号重试不会重复发放。冰箱满时取餐不会成功，整份餐食入库回滚，订单仍可重试领取。回执在服务重启后继续有效。

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

Overview proportion: the building, deck and bears render at 65% scale only in the island overview; other views use the original scale and seating coordinates. Ground ray hits convert from world to building coordinates. Two bays bring water closer to the terrace and curved window seats; the opposite sandy coast remains broad. Terrain and water shader share the same bay formula.


## Camera, menu and service flow
Entry now opens the island overview. Its orbit target is the planet center (0, -18.25, 0), and two-finger zoom never shifts that pivot. Interior gestures keep a higher minimum elevation; foreground window sections, nearby hanging lights and extremely close chairs use a camera-dependent cutaway. A planar distant-ocean backdrop is enabled only in interior/detail views to supply a visible horizon where the small planet curves away. This is a scenic projection, not extra walkable water.

The menu exposes coffee, cocktails and all six desserts, with thumbnails rendered from the actual food models. Scoped navigation layout contains all five buttons at mobile widths. Ordering walks the bear to the counter before submission, with duplicate clicks blocked and pending approach cancelled on exit. Shared server service timestamps drive host preparation, pouring/plating; ready food transfers to the guest. Sitting eases into the cushion and consuming plays a short raise-cup/food motion before the existing eat action. Takeaway still uses the existing transactional delivery to the home fridge; its preparation is visual, not a new delivery queue.


## 吧台与主理熊聊天
吧台前新增 3 个朝向主理人的高靠背座位，点击走近后落座。坐在吧台时出现“和主理熊聊聊”，离座收起。对话通过鉴权和 CSRF 保护的 `/api/cafe/chat` 使用现有 `resolveDesignEnv` 文字模型配置（腾讯优先），不调用 3D 模型。菜单推荐与聊天不能直接下单。

聊天不进入公共访客状态，不共享给其他玩家；服务器仅内存保留最近 6 轮，闲置 30 分钟后清理，重启不保留。单条上限 600 字，每人同时 1 次，全服同时 4 次，45 秒超时；成功消息编号重试不会重复调用。页面离开不会取消已经提交的文字请求。

验证：20 项相关单元测试通过；本地 Chromium 实测走到吧台落座、手机与桌面聊天面板及离座隐藏。浏览器聊天使用模拟回复，本地未携带线上腾讯密钥，因此真实模型连通性需部署后验证。


## 三维海景与昼夜（2026-10-04）
窗外没有静态海景图片或玻璃贴图。细节视图使用 192×192 分段海面网格，顶点随时间起伏，法线与太阳方向共同形成动态反光；天空是空间中的渐变穹顶，太阳为球体，云由 72 个实例化立体球团组成并缓慢漂移。玻璃保持独立透明材质。
太阳和方向光共用同一轨迹，按服务器时间换算北京时间，固定约 06:00 东方日出、18:00 西方日落；这是虚拟海岛节律，未模拟季节与真实地理纬度。雨天隐藏太阳并减少直射光，室内暖灯随日光减弱渐亮。室内允许接近水平的观看角度，相机高度不低于地面上方，仍无法翻到地板下。
全景保留球形海洋；近景远海是额外的三维延展网格，切到星球全景时隐藏，不是球面海洋的严格物理延伸。用户需朝对应的东西向窗户观看，不能在所有朝向同时看到太阳。
验证：太阳轨迹连续性/方向/昼夜测试与原海岛测试通过；本地 Chromium 渲染日出、正午、日落、雨天和夜晚，手机/桌面截图检查，无 WebGL 编译错误。


## 点单、递餐与手势重做（2026-10-04）
- 进店只走到门内，不自动安排点单或座位。点击吧台走过去，或手动走到吧台范围，主理熊出现招呼气泡并打开菜单；点击橱窗甜品也能带着选择去吧台。
- 菜单根据内置图像生成模型的纸质菜单概念实现为 HTML/CSS；所有食物缩略图仍实时渲染游戏里的真实模型，没有用概念图替代界面或实物。菜单分咖啡、鸡尾酒、甜品，可选一杯饮品加一份甜品，选择堂食或打包。
- 每间咖啡馆的主理熊按顺序制作。主理熊走到咖啡工作台或甜品柜，手臂指向实际持物点，端回餐食放到托盘。食物准备好后留在吧台，用户点击取餐才去领取；取餐时主理熊递盘、用户伸手接盘再放低，随后由用户选择座位。堂食只有坐下后才出现享用按钮。
- `cafe_orders.collected` 区分下单和领取，旧回执按已领取处理；新增 `cafe_pockets` 持久化未取订单与堂食托盘。订单与两件物品领取使用同一数据库事务，重复领取不重复发放，刷新或服务器重启可恢复。座位占用仍是临时在线状态。
- 旋转改为与私人星球相同的方向与灵敏度；双指按屏幕方向平移、围绕手指中心缩放；全景始终以星球球心旋转。松开一根手指后续接手势，不误判点击。滚轮速度同步私人星球；Shift＋拖动可平移。各区域记住自己的视角；菜单在手机上打开时调整画面构图让主理熊留在菜单上方。
- 验证：真实浏览器走完进店 → 到吧台 → 双餐选择 → 制作 → 主动取盘 → 自选座位 → 享用；Chrome DevTools 触摸事件验证旋转、双指缩放平移、抬指续接、无误走路、视角记忆及地板高度限制。桌面和手机尺寸截图检查通过，实体 iPhone 操作仍需部署后体验。


## WaterThreeJS ocean

MIT source is vendored under `dist/vendor/water-threejs` at revision `4f85f4a557da80a1dd24b9243869177f30c604c7`. No runtime CDN or paid API. Keeps Three.js r170 and existing sky/solar clock with one final tone-map pass. HDR/depth prepass supports refraction. Detail view uses a level ocean and lowers the beach into a gentle island, preserving shoreline XZ coordinates; anchored palms/rocks/dolphins are remapped with it. Globe view restores the original spherical beach and anchor orientations.

Coarse-pointer/small initial viewports use 128x80 rings, 10 wave components, 70% refraction resolution and no screen-space reflection. Desktop uses 192x112, 16 components and sky reflections. Targets resize and dispose with the cafe. Browser-tested, not physical-device performance certification. Shore foam is depth-driven, not a full fluid solver.


## 场景直接交互（2026-10-04）
- 刷新和重新打开网页默认留在私人星球，不再恢复 `echoo-cafe-open`；用户点击入口才加入公共咖啡馆。
- 复用 `planetArrival` 加载页，等待海岸纹理、GLB、甜品与植物资源和 shader 编译后再揭开；加载期间咖啡馆不可交互。
- 删除底部场景切换导航。全景点咖啡馆进入；店内点门口、外部沙滩或海水，熊走到门外后切到外景。缩放可在近景和星球全景之间切换。
- 点甜品柜先走过去，再显示选品近景；再次点具体甜品带入菜单。点地板可离开选品近景。
- 点自己已完成的托盘领取，不再依赖取餐文字按钮，也不等待主理熊额外递盘；主理熊仍负责制作和放到吧台。领取时的服务端事务和订单幂等保留，其他订单正在制作不会阻塞已完成订单的领取。
- 熊端盘等用户点座位；落座后点实际杯子/甜品享用，防止连续点击重复发请求。
- 修正海豚 GLB 鼻尖原始朝向，统一为 +Z；身体俯仰沿抛物线速度切线，出入水水花位于轨迹与海平面的交点。现有素材仅有海豚，没有单独鲸鱼模型。
- 全景海面保留球体，并使用球面三向波纹和小幅径向起伏，海岸边衰减，避免平滑球体看起来像旧海面以及波浪切穿沙滩。


2026-10-04 interaction follow-up:
- Fresh visits clear held dine-in food; uncollected orders remain collectible. Leaving or standing clears the held tray. Seated meals progress every seven seconds; both guests and observers see the eating animation.
- Chair meshes (including backrests) are selectable. Host clicks guide the visitor to an available bar seat and open the existing private AI chat.
- Door, outdoor floor and sea/beach clicks exit. Empty window scenery clicks use an outdoor ground projection as fallback.
- The shared camera captures the active cafe renderer at the current view, saves into the existing account photo album, and does not move the camera. Cafe photo mode currently supports the current pose.
- Music reuses the existing player and its mini controls; no second player and no stop on arrival. Wave ambience remains independent.
