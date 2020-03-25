const ora = require('ora'); // 用于创建spinner 也就是loading效果
const path = require('path'); // node自带的路径模块
const fs = require('fs-extra'); // 文件系统
const boxen = require('boxen'); // 用于创建头尾的小面板
const chalk =require('chalk'); // 用于打印彩色信息输出
const beeper = require('beeper'); // 可以“哔”一下你  例如出错的时候
const download = require('download-git-repo'); // git仓库下载模块
const Generator = require('yeoman-generator');
const updateNotifier = require('update-notifier'); // 用于检测包的线上版本与本地版本 来提示用户更新脚手架版本
const pkg = require('../../package.json');

// 面板样式配置
const BOXEN_OPTION = {
  padding: 1,
  margin: 1,
  align: 'center',
  borderColor: 'yellow',
  borderStyle: 'round'
};

const APP_TYPE = {
  webpack: 'webpack',
  rollup: 'rollup'
};

const DEFAULT_DIR = 'webpack-app';
const GIT_BASE = 'https://github.com/';
const TPL_REPOSITORY = 'alienzhou/webpack-kickoff-template'; // TODO: 替换成自己的模板仓库
const ROLLUP_TPL_REPOSITORY = 'alienzhou/rollup-kickoff-template'; // TODO: 替换成自己的模板仓库

// loading 配置
const ORA_SPINNER = {
  "interval": 80,
  "frames": [
    "   ⠋",
    "   ⠙",
    "   ⠚",
    "   ⠞",
    "   ⠖",
    "   ⠦",
    "   ⠴",
    "   ⠲",
    "   ⠳",
    "   ⠓"
  ]
};

class WebpackLuJunGenerator extends Generator {
  constructor(params, opts) {
    super(params, opts);

    this.type = APP_TYPE.webpack;
    this.dirName = this._getDefaultDir();
    this._getDefaultDir = this._getDefaultDir.bind(this);
    this._askForDir = this._askForDir.bind(this);
    this._askDirFlow = this._askDirFlow.bind(this);
    this._askForAppType = this._askForAppType.bind(this);
    this._askForOverWrite = this._askForOverWrite.bind(this);
  }

  _getDefaultDir() {
    return `${this.type}-app`;
  }


  /**
   * 检查版本信息
   */
  _checkVersion() {
    this.log();
    this.log('🛠️  Checking your Generator-LuJun-Cli version...');

    let checkResult = false;
    const notifier = updateNotifier({
      pkg,
      updateCheckInterval: 0
    });

    const update = notifier.update;
    if(update) {
      const messages = [];
      messages.push(
        chalk.bgYellow.black(' WARN: ') + ' Generator-lujun-cli is not latest.\n'
      );
      messages.push(
        chalk.grey('current ')
        + chalk.grey(update.current)
        + chalk.grey(' → ')
        + chalk.grey('latest ')
        + chalk.green(update.latest)
      )
      messages.push(
        chalk.grey('Up to date ')
        + `npm i -g ${pkg.name}`
      );
      this.log(boxen(messages.join('\n'), BOXEN_OPTS));
      beeper();
      this.log('🛠️  Finish checking your Generator-lujun-cli. CAUTION ↑↑', '⚠️');
    } else {
      checkResult = true;
      this.log('🛠️  Finish checking your Generator-lujun-cli. OK', chalk.green('✔'));
    }

    return checkResult;
  }

  /**
   * 打印环境信息
   */
  _printEnvInfo() {
    this.log(chalk.grey('Environment Info:'));
    this.log(chalk.grey(`Node\t${process.version}`));
    this.log(chalk.grey(`PWD\t${process.cwd()}`));
  }

  initializing() {
    this.log();

    const version = `(v${pkg.version})`;
    const messages = [];

    messages.push(
      `💁 Welcome to use Generator-lujun-cli ${chalk.grey(version)}   `
    );
    messages.push(
      chalk.yellow('You can create a Webpack/Rollup-based frontend environment.')
    );

    this.log(
      boxen(messages.join('\n'), {
        ...BOXEN_OPTION,
        ...{
          borderColor: 'green',
          borderStyle: 'doubleSingle'
        }
      })
    );

    this._printEnvInfo();
    this._checkVersion();
  }

  _askForAppType() {
    const opts = [{
      type: 'list',
      name: 'type',
      choices: [{
        name: 'webpack (app based on webpack, webpack-cli, wds...)',
        value: APP_TYPE.webpack
      }, {
        name: 'rollup (maybe have a try for developing a library)',
        value: APP_TYPE.rollup
      }],
      message: 'Please choose the build-tool for your project:',
      default: APP_TYPE.webpack
    }];

    return this.prompt(opts).then(({type}) => {
      this.type = type;
      this.dirName = this._getDefaultDir();
    })

  }

  _askForDir() {
    const opts = [{
      type: 'input',
      name: 'dirName',
      message: 'Please enter the directory name for your project:',
      default: this.dirName,
      validate: dirName => {
        if(dirName.length < 1) {
          beeper();
          return '⚠️  directory name must not be null！';
        }
        return true;
      }
    }]
  }

  _askForOverWrite() {
    const destination = this.destinationPath();
    const dirName = this.dirName;
    if(!fs.existsSync(path.resolve(destination, dirName))) {
      return Promise.resolve();
    }

    const warn = chalk.grey('CAUTION! Files may be overwritten.');
    const opts = [{
      type: 'confirm',
      name: 'overwrite',
      message: `⚠️  Directory ${dirName} exists. Whether use this directory still? ${warn}`,
      default: false
    }]

    return this.prompt(opts).then(({overwrite}) => {
      if(!overwrite) {
        this.dirName = DEFAULT_DIR;
        return this._askDirFlow();
      }
    })
  }

  _askDirFlow() {
    return this._askForDir().then(this._askForOverWrite());
  }

  /**
   * 获取用户输入
   */
  prompting() {
    this.log();
    this.log('⚙  Basic configuration...');
    const done = this.async();

    this._askForAppType()
    .then(this._askDirFlow)
    .then(done)
  }


  _walk(filePath, templateRoot) {
    if (fs.statSync(filePath).isDirectory()) {
      fs.readdirSync(filePath).forEach(name => {
        this._walk(path.resolve(filePath, name), templateRoot);
      })
      return;
    }

    const relativePath = path.relative(templateRoot, filePath);
    const destination = this.destinationPath(this.dirName, relativePath);
    this.fs.copyTpl(filePath, destination, {
      dirName: this.dirName
    })
  }

  _downloadTemplate(repository) {
    return new Promise((resolve, reject) => {
      const dirPath = this.destinationPath(this.dirName, '.tmp');
      download(repository, dirPath, err => err ? reject(err) : resolve());
    })
  }


  /**
   * 写入模板文件及目录
   */
  writing() {
    const done = this.async();
    const repository = this.type === APP_TYPE.webpack ?
      TPL_REPOSITORY :
      ROLLUP_TPL_REPOSITORY;
    
    this.log('⚙  Finish basic configuration.', chalk.green('✔'));
    this.log();
    this.log('📂 Generate the project template and configuration...');

    let spinner = ora({
        text: `Download the template from ${GIT_BASE}${repository}...`,
        spinner: ORA_SPINNER
    }).start();

    this._downloadTemplate(repository)
      .then(() => {
        spinner.stopAndPersist({
          symbol: chalk.green('   ✔'),
          text: `Finish downloading the template from ${GIT_BASE}${repository}`
        });

        spinner = ora({
          text: `Copy files into the project folder...`,
          spinner: ORA_SPINNER
        }).start();

        const templateRoot = this.destinationPath(this.dirName, '.tmp');
        this._walk(templateRoot, templateRoot);

        spinner.stopAndPersist({
          symbol: chalk.green('   ✔'),
          text: `Finish copying files into the project folder`
        });

        spinner = ora({
          text: `Clean tmp files and folders...`,
          spinner: ORA_SPINNER
        }).start();

        fs.removeSync(templateRoot);
        spinner.stopAndPersist({
          symbol: chalk.green('   ✔'),
          text: `Finish cleaning tmp files and folders`
        });
        done();
      })
      .catch(err => this.env.error(err));
  }

  /**
   * 安装依赖
   */
  install() {
    this.log();
    this.log('📂 Finish generating the project template and configuration.', chalk.green('✔'));
    this.log();
    this.log('📦 Install dependencies...');

    this.npmInstall('', {}, {
      cwd: this.destinationPath(this.dirName)
    });
  }

  end() {
    const dir = chalk.green(this.dirName);
    const info = `🎊 Create project successfully! Now you can enter ${dir} and start to code.`;
      this.log('📦 Finish installing dependencies.', chalk.green('✔'));
      this.log();
      this.log(
        boxen(info, {
          ...BOXEN_OPTS,
          ...{
              borderColor: 'white'
          }
        })
    );
  }
}

export default WebpackLuJunGenerator;
