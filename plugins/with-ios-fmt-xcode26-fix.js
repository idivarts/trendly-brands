const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = '# [trendly-brands] ios fmt xcode26 consteval workaround';

/**
 * Xcode 26.4+ Apple Clang rejects fmt 11.x FMT_STRING consteval paths when RN is built from source.
 * @see https://github.com/facebook/react-native/issues/55601
 * @see https://github.com/expo/expo/issues/44229
 */
function insertAfterReactNativePostInstallCall(contents, insertion) {
    const anchor = 'react_native_post_install(';
    const callStart = contents.indexOf(anchor);
    if (callStart === -1) {
        return null;
    }

    const openParen = callStart + anchor.length - 1;
    let depth = 0;
    for (let i = openParen; i < contents.length; i++) {
        const c = contents[i];
        if (c === '(') {
            depth++;
        } else if (c === ')') {
            depth--;
            if (depth === 0) {
                let insertAt = i + 1;
                const rest = contents.slice(insertAt);
                const leadingWs = rest.match(/^\s*\n/);
                if (leadingWs) {
                    insertAt += leadingWs[0].length;
                }
                return contents.slice(0, insertAt) + insertion + contents.slice(insertAt);
            }
        }
    }
    return null;
}

function withIosFmtXcode26Fix(config) {
    return withDangerousMod(config, [
        'ios',
        async (config) => {
            const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
            if (!fs.existsSync(podfilePath)) {
                return config;
            }

            let contents = fs.readFileSync(podfilePath, 'utf8');
            if (contents.includes(MARKER)) {
                return config;
            }

            const rubyBlock =
                `\n    ${MARKER}\n` +
                `    # Force C++17 for fmt only — avoids broken consteval checks in Apple Clang (Xcode 26.4+).\n` +
                `    installer.pods_project.targets.each do |target|\n` +
                `      if target.name == 'fmt'\n` +
                `        target.build_configurations.each do |bc|\n` +
                `          bc.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'\n` +
                `        end\n` +
                `      end\n` +
                `    end\n`;

            const next = insertAfterReactNativePostInstallCall(contents, rubyBlock);
            if (next == null) {
                console.warn(
                    '[with-ios-fmt-xcode26-fix] Could not find react_native_post_install(...); Podfile not patched.'
                );
                return config;
            }

            fs.writeFileSync(podfilePath, next);
            return config;
        },
    ]);
}

module.exports = withIosFmtXcode26Fix;
