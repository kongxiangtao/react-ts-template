const {
    override,
    addLessLoader,
    fixBabelImports,
    addPostcssPlugins,
    overrideDevServer,
    watchAll,
    addWebpackPlugin
} = require('customize-cra');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');

console.log('process.env.NODE_ENV', process.env.NODE_ENV);

const addDevServerConfig = () => (config) => {
    //console.log('dev server', config);
    return {
        ...config,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
            }
        }
    };
};

module.exports = {
    webpack: override(
        addLessLoader({
            lessOptions: {
                modifyVars: {
                    //'@brand-color': '#ef5350', // 主题色
                    // 默认是1px对应350px宽度的设计稿
                    '@hd': '2px', // 750宽度设计稿
                    '@item-hover-bg': 'rgba(79, 139, 255, 0.08);'
                },
                javascriptEnabled: true
            }
        }),
        // 按需引入组件
        fixBabelImports('react-vant', {
            libraryDirectory: 'es',
            style: true
        }),
        fixBabelImports('antd', {
            libraryDirectory: 'es',
            style: true
        }),
        addPostcssPlugins([
            // 高清方案
            require('postcss-px-to-viewport')({
                // 设计稿尺寸
                viewportWidth: 750,
                unitPrecision: 4,
                viewportUnit: 'vw',
                // 忽略 px 转 vw 的css name 后缀
                selectorBlackList: ['ant', 'wrap', 'layout-video']
            })
        ]),
        addWebpackPlugin(new ProgressBarPlugin()),
        process.env.ANALYZER && addWebpackPlugin(new BundleAnalyzerPlugin())
    ),
    devServer: overrideDevServer(addDevServerConfig(), watchAll())
};
