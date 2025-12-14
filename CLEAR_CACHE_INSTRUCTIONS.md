# 清除缓存和重新测试步骤

## 1. 清除浏览器缓存和数据
- 按 `Ctrl + Shift + Delete` 打开清除浏览器数据窗口
- 或者按 `F12` 打开开发者工具 → Application → Storage → Clear site data

## 2. 硬刷新页面
- 按 `Ctrl + Shift + R` 或 `Ctrl + F5`

## 3. 打开浏览器控制台
- 按 `F12` → Console 标签
- 这里会显示客户端的调试日志（🔵、🎯、📖、▶️ 等）

## 4. 开始新游戏
- 点击"开始新游戏"
- **不要**继续旧游戏

## 5. 查看日志
同时查看：
- **浏览器控制台**（客户端日志）
- **终端**（服务器端日志）

应该能看到：
- 🎭 [getGamePhase] 计算阶段
- 🔵 [makeChoice] 开始处理选择  
- 📖 序章阶段
- 🎯 目标选择判断

## 6. 验证第2轮
在第1轮做出选择后，应该看到：
- roundNumber: 2
- phase: 'opening'（不是 'development'）
- 选项没有 difficulty 字段
