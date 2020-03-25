# generator-lujun-cli

## 整体实现思路
-  检查脚手架的版本信息
    - 通过update-notifier检查是否需要更新
    - 利用chalk打印出彩色信息
    - log到控制台最新版本和本地版本

## 使用脚手架 🚀
使用该脚手架会同时需要 Yeoman 与上述咱们刚创建的 yeoman-generator。当然，有一个前提，Yeoman 与这个 generator 都需要全局安装。全局安装 Yeoman 没啥有问题（```snpm install -g yo```），处理 generator-lujun-cli 的话可能有几种方式：

- 直接发布到 npm，然后正常全局安装

- 直接手动拷贝到全局 node_modules

- 使用npm link将某个目录链接到全局