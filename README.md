# MC 版本库

国际基岩版历史版本下载索引 + 网易中国版现状。纯静态也能跑，接上 Flask 后端会实时向版本库查询最新条目。

线上：https://mmmerk1.github.io/mc-version-archive/

## 有什么

- **国际基岩版**：800 个安装包，0.1.0（2011-08）到 26.70.24，正式版 267 个 / 测试版 533 个。每个版本给 ARMv7 与 ARMv8 两个架构，三个网盘镜像（123云盘 / OneDrive / 夸克网盘）可切换。
- **网易中国版**：官方当前包（手游 3.10.5.301327、iOS 3.10.10.301428、端游启动器 1.15.0.464），版本时间线与历史包的真实情况。
- **维基入口**：每张版本卡都有「维基」按钮，直达 zh.minecraft.wiki 按版本号的搜索结果。

## 数据来源

| 内容 | 来源 |
|---|---|
| 国际版版本号、日期、大小、下载镜像 | bbk.endyun.ltd 版本库公开 API（`get_version` / `search_version` / `last_version`） |
| 网易版当前版本、补丁号、官网地址 | 网易更新接口（`g79` packlist，经 ianzb.cn 转述，每小时更新） |
| 版本细节、更新日志 | 中文 Minecraft Wiki |

`data-versions.js`、`data-netease.js` 是抓好的快照，静态托管直接读它；后端在线时 `/api/versions` 也可以重新拉。

## 跑后端

```bash
pip install -r requirements.txt
python3 app.py        # 默认 5000
```

接口：

- `GET /api/health`
- `GET /api/versions` —— 本地快照
- `GET /api/search?q=1.20.81` —— 实时查上游版本库，失败自动回落快照
- `GET /api/last` —— 最新正式版与测试版

## 文件

```
index.html          页面
styles.css          样式
app.js              筛选 / 搜索 / 分页 / 标签页 / 下载镜像切换
data-versions.js    800 条版本快照
data-netease.js     网易版快照与时间线
app.py              Flask 后端（API + 静态托管）
requirements.txt
```

## 说明

安装包由第三方版本库托管，本站只做索引，不转发、不二次打包。请支持正版，安装包仅供学习交流，下载后 24 小时内删除。
