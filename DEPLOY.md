# 部署到 GitHub 指南（3 分钟）

本地仓库已全部准备好：代码已提交（`main` 分支）、提交身份 `lizuonong`、GitHub Pages 自动部署工作流（`.github/workflows/deploy.yml`）均已就绪。

## 步骤 1：创建远程仓库（需你的账号操作）

打开 <https://github.com/new>：

- Repository name：`tingjian-buliang-macau`
- 可见性：**Public**（GitHub Pages 要求）
- 不要勾选任何初始化选项（README / .gitignore / license 都不选，避免冲突）
- 点击 **Create repository**

## 步骤 2：推送到 GitHub

创建完成后，任选一种方式：

### 方式 A（推荐，交给 AI）
把仓库地址发给 AI（形如 `https://github.com/lizuonong/tingjian-buliang-macau`），AI 会执行：

```powershell
git remote add origin https://github.com/lizuonong/tingjian-buliang-macau.git
git push -u origin main
```

> 推送时 Windows 的 Git Credential Manager 会弹出浏览器窗口，点击「登录 GitHub 并授权」即可，无需手动输入令牌。

### 方式 B（自己执行）
```powershell
git remote add origin https://github.com/lizuonong/tingjian-buliang-macau.git
git push -u origin main
```

## 步骤 3：开启 GitHub Pages（一次性设置）

仓库页面 → **Settings** → **Pages** → Source 选择 **GitHub Actions**。

此后每次推送到 `main`，`.github/workflows/deploy.yml` 会自动构建并发布。

## 完成 ✅

- 站点地址：`https://lizuonong.github.io/tingjian-buliang-macau/`
- 构建产物在 `dist/`（相对路径 base，子路径部署无需额外配置）
