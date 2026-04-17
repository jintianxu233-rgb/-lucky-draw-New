# Lucky Draw / 抽奖页面 (Vite)

一个基于 Vite 的纯前端抽奖项目（无后端、无数据库、可直接部署）。

## 项目结构

```text
.
├─ index.html
├─ package.json
├─ .gitignore
├─ src
│  ├─ main.js
│  └─ style.css
└─ README.md
```

## 本地运行

先进入项目目录，然后执行：

```bash
npm install
npm run dev
```

启动后终端会显示本地地址（通常是 `http://localhost:5173`），在浏览器打开即可。

## 打包与预览

```bash
npm run build
npm run preview
```

## 免费发布到 GitHub Pages

### 1) 安装依赖

```bash
npm install
```

### 2) 一键发布

```bash
npm run deploy
```

这个命令会自动：
- 先执行 `npm run build`
- 把 `dist` 发布到 `gh-pages` 分支

### 3) 在 GitHub 开启 Pages（首次需要）

进入仓库 `Settings` -> `Pages`：
- `Source` 选择 `Deploy from a branch`
- `Branch` 选择 `gh-pages`，目录选 `/ (root)`
- 保存后等待几分钟生效

发布地址：

`https://jintianxu233-rgb.github.io/lucky-draw`
