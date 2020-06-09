import * as bundle from '../package.json';
import babel from 'rollup-plugin-babel';
import filesize from 'rollup-plugin-filesize';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const bundleBanner = `/**
 * ${bundle.name}
 * @summary     ${bundle.description}
 * @version     ${bundle.version}
 * @copyright   ${bundle.author}
 * @license     ${bundle.license}
 * @time        ${Date()}
 */
`;

const classNames = [];

function genarateConfig(_opt, _min) {
    return {
        input: 'src/mind.svg.js',
        output: {
            file: `.dist/mind.svg${_opt.type ? '.' + _opt.type : ''}${_min ? '.min' : ''}.js`,
            name: 'MindSVG',
            format: _opt.format,
            sourcemap: true,
            banner: bundleBanner
        },
        plugins: [
            resolve({browser: true}),
            commonjs(),
            babel({
                include: 'src/**',
                runtimeHelpers: true,
                babelrc: false,
                presets: [
                    [
                        '@babel/preset-env',
                        {
                            modules: false
                        }
                    ]
                ],
                plugins: [
                    ['@babel/plugin-proposal-class-properties'],
                    ['@babel/plugin-transform-classes'],
                    [
                        '@babel/plugin-transform-runtime',
                        {
                            corejs: false,
                            helpers: true,
                            useESModules: true,
                            regenerator: true
                        }
                    ]
                ]
            }),
            _min ? terser({
                mangle: {
                    reserved: classNames
                },
                output: {
                    preamble: bundleBanner
                }
            }) : {},
            filesize()
        ]
    }
}

const options = [{
    format: 'esm'
}, {
    type: 'iife',
    format: 'iife'
}];

const destConfigs = [];

for (const opt of options) {
    destConfigs.push(genarateConfig(opt, false));
    destConfigs.push(genarateConfig(opt, true));
}

export default destConfigs;