# 阿球 Echoo · 腾讯轻量云部署（与现有播客并存）

适用环境：Ubuntu 24.04、Docker Compose v2。此项目独立监听 8081，容器内部端口为 8080。现有播客的 Nginx 80 和 Python 8000 保持原配置；不用停服务，不用重装系统，也不用购买数据库。

建议先做 HTTP 手机试玩，只录入测试密码和测试手账。正式使用前配置 HTTPS。服务器内存较紧，本配置限制容器最多使用 256MiB 内存和 0.75 个 CPU；3D 渲染在访问设备上完成。这个限制不是负载验收结果，部署后观察是否影响现有项目。

## 1. 获取代码

在服务器终端执行：

```bash
cd ~
git clone https://github.com/liyanli2025-ops/little_planet.git little-planet
cd ~/little-planet
```

若提示 git 不存在，再安装：sudo apt-get update && sudo apt-get install -y git。
如果目录已经存在，先进入目录检查 git status，不要覆盖里面的文件；已有同仓库部署可执行 git pull --ff-only。

## 2. 生成配置

将下方 YOUR_SERVER_IP 替换为你控制台当前显示的公网 IP。完整网址必须与手机实际打开的网址一致。

```bash
python3 scripts/configure.py --origin http://YOUR_SERVER_IP:8081
```

脚本生成独立的 .env，配置网站地址和端口，文件权限为 600。已有 .env 时会停止，不覆盖配置。加入口令由第一位住户在网页上自己设置。

HOST_PORT 默认为 8081。如果被其他程序占用，修改 .env 中 HOST_PORT，并同步修改 PUBLIC_ORIGIN 的端口，以及腾讯防火墙规则。

## 3. 构建并启动

```bash
sudo docker compose up -d --build
sudo docker compose ps
curl http://127.0.0.1:8081/api/health
```

健康接口应返回 {"ok":true}。第一次构建需要下载官方 node:24-bookworm-slim 镜像，如果下载失败，先保留错误输出；不要因此重装 Docker 或停掉播客。

这一步仅创建 little-planet 项目的容器和数据卷，不修改宿主机 Nginx，不使用 80/8000 端口。

## 4. 放行 8081，手机打开

在腾讯云轻量服务器详情 → 防火墙中新增 **TCP 8081** 入站规则。不要删除已有规则；无须开放数据库端口。

如果启用了 Ubuntu 的 UFW，还需执行 sudo ufw allow 8081/tcp；可以先用 sudo ufw status 看是否 active。Docker 发布端口与宿主机防火墙的关系较特殊，以腾讯云入站规则作为外层限制，不要仅依赖 UFW。

手机使用浏览器打开：

http://YOUR_SERVER_IP:8081

这是 HTTP 试玩地址。请使用临时测试密码和测试数据。HTTPS 的域名或私有网络入口确定后，将 PUBLIC_ORIGIN 改成真实 HTTPS 来源，再重建容器使其生效；不要直接把公网 IP 前面的 http 改成 https，否则并没有证书和 TLS 服务。

## 5. 两个人注册与配对

第一位住户打开网页，直接创建账号，选择一只熊，并设置 6–24 位字母或数字的加入口令。请由服务器主人先完成这一步，再把网址和口令私下告诉另一位。

第二位打开网页，点击“用对方的口令加入”，填写收到的口令，注册自己的账号并选择剩下的熊。账号密码由两个人各自设置，与加入口令不同。

第二位注册之前，第一位可以在“账号与配对 → 设置新的加入口令”修改口令；旧版本已有的第一位账号也可以这样替换原来的长口令，不影响存档。

然后一人点“账号与配对 → 生成邀请码”，另一人在自己的账号输入配对邀请码。配对邀请码 24 小时有效、只能使用一次。加入口令只用于注册，配对邀请码用于允许互访。

旧 .env 中的 REGISTRATION_CODE 仅作已有旧账号的临时兼容。第一位设置新口令后，旧值不再用于注册；新部署无需设置此变量。

## 6. 备份

```bash
cd ~/little-planet
sudo sh scripts/backup.sh
```

生成 backups/planet-时间.sqlite，并执行 SQLite 完整性检查。备份使用 SQLite 在线备份接口，适合运行中的 WAL 数据库，不是只复制主文件。脚本通过 docker compose exec 从容器内部导出备份，并在服务器端再次校验；校验成功后才生成最终 .sqlite 文件，失败时清理本次临时文件。备份包含两人的全部记录和账号，请另存到你控制的其他设备；同一硬盘上的备份不能防止服务器磁盘损坏。

脚本不自动删除旧备份。请留意磁盘占用，确认异地副本可用后再自行整理旧文件。可以以后为该脚本配置定时备份，此版本没有替你创建系统定时任务。

恢复会覆盖小星球数据库，脚本会要求输入 RESTORE，并先备份当前版本：

```bash
sudo sh scripts/restore.sh backups/需要恢复的文件.sqlite
```

恢复过程只停止这个 Compose 项目的 planet 服务。恢复后会撤销所有登录会话和未使用邀请码，两人需要重新登录。若当前容器/数据库已损坏，自动备份可能失败；此时保留现状与报错，再按实际情况进行恢复，不要反复删除文件。

## 7. 更新与排查

```bash
cd ~/little-planet
sudo sh scripts/backup.sh
git pull --ff-only
sudo docker compose up -d --build
sudo docker compose ps
sudo docker compose logs --tail=80 planet
sudo docker stats --no-stream
```

正常重建容器会复用数据卷。**不要执行 docker compose down -v 或删除 little-planet_planet_data**，那会删除存档。也不要执行针对整个 Docker 的 prune 清理命令来处理本项目问题。

- 旧脚本备份提示找不到 /tmp/planet-…sqlite：这是 docker cp 读取 tmpfs 的限制。先执行 git pull --ff-only 获取修复后的脚本，再运行 sudo sh scripts/backup.sh；出现 Backup saved 后再重建容器。无需删除数据库或数据卷。
- 手机上打不开，但服务器 health 正常：检查公网 IP、腾讯入站规则、端口和网络。
- 页面提示来源不匹配：检查 .env 中 PUBLIC_ORIGIN 与地址栏一致（协议/域名/IP/端口），然后 sudo docker compose up -d。
- 手机出现保存冲突：先导出未提交副本，再重新载入；另一台设备可能刚修改了同一份存档。
- 登录后不能去对方那里：需双方都注册并接受邀请码，仅注册不自动配对。
- 容器退出/OOM：保留 logs 和 docker stats 输出，检查内存，不要先停播客或其他系统服务。

## 8. 忘记密码

在服务器上执行（参数替换为账号名）：

```bash
sudo bash scripts/reset-password.sh alice
```

脚本在终端隐藏输入两次新密码，通过标准输入传给容器，不把密码写进 shell 命令历史。会撤销这个账号的旧会话，但不会删除手账。需要服务器管理权限才能进行此操作。

## 正式使用前的 HTTPS

当前没有域名，先完成上述手机试玩即可。之后可以选择独立域名的 HTTPS 入口，或两台设备都加入的私有网络 HTTPS 入口。已有播客不需要搬迁；确定入口后再增加相应代理配置，并将小星球限制到所需监听地址。HTTPS 模式下服务会使用 Secure Cookie。

参考官方文档：[Docker 端口发布](https://docs.docker.com/engine/network/port-publishing/)、[腾讯轻量服务器防火墙](https://cloud.tencent.com/document/product/1207/44577)。


## 天气与系统时间

本版本使用 [Open-Meteo](https://open-meteo.com/en/docs) 查询温度、天气代码、所在地时区与日出日落，无需配置密钥。默认免费接口仅用于非商业用途；[免费额度与许可](https://open-meteo.com/en/pricing)以官方页面为准。商业发布时需要调整服务方案。天气来自模型数据，不保证与你窗外每一刻完全一致。

更新后登录，真实天气模式会自动尝试获取设备所在地；首次使用时需要允许浏览器的定位请求。可以在右侧「日常」→「所在地与定位」重新定位，城市搜索收在备用入口。两位各自同步自己的地点；互访时使用对方星球地点，不使用访客位置。设备时钟提供当前时刻，按天气地点的时区显示；未设地点时使用设备时区，以 06:00–18:00 作为暂定昼间。设备时间不准确时显示也会受影响。

HTTP 公网 IP 地址无法使用浏览器定位，可直接搜索城市；HTTPS 下首次自动请求仍需用户允许定位；拒绝或超时不会反复弹窗，可手动重试。GPS 坐标在浏览器和服务端均约化到小数点后一位；对方接口只返回地点名称、时区和天气，不返回坐标。设备定位不做反向地址查询，显示「设备所在地」。没有持续位置追踪；重新进入页面会再次尝试定位，也可主动点击重新定位。手动天气模式不会在进入时被自动定位覆盖。

服务端缓存约 15 分钟，客户端前台每分钟检查一次；查询失败保留上次数据并标明时间，未获取成功显示空温度。天气和地点存入已有 SQLite settings 表，备份会一起保留，不改动原有游戏存档。点击晴雨雪按钮进入手动天气；「设置所在地」里可恢复自动模式。夜晚和雨雪分别处理，夜雨仍会下雨并穿雨衣。

服务器需要能通过 HTTPS 访问 api.open-meteo.com 和 geocoding-api.open-meteo.com。已在开发环境验证真实请求；腾讯云服务器到这两个站点的连接仍需部署后确认。连接失败不会伪装成晴天实况，页面会提示重试。
