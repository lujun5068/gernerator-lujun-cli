# generator-lujun-cli

## 整体实现思路
-  检查脚手架的版本信息
    - 通过update-notifier检查是否需要更新
    - 利用chalk打印出彩色信息
    - log到控制台最新版本和本地版本

## 使用脚手架 🚀
```
// 全局安装
npm i yo -g  
npm i generator-lujun-cli -g

// 开始使用
yo lujun-cli
```