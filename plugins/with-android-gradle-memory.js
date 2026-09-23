const { withGradleProperties } = require('expo/config-plugins');

const KEY = 'org.gradle.jvmargs';

/**
 * Android Lint (:expo-modules-core:lintVitalAnalyzeRelease) exhausts the default
 * 512m Metaspace ceiling and fails the release build with OutOfMemoryError.
 * Adding expo-updates pushed it over the edge — lint loads class metadata for
 * every autolinked module, and Metaspace holds it all.
 *
 * MaxMetaspaceSize is a ceiling, not a reservation, so raising it does not
 * increase the build's baseline memory use.
 */
const JVM_ARGS = '-Xmx4096m -XX:MaxMetaspaceSize=2048m';

function withAndroidGradleMemory(config) {
    return withGradleProperties(config, (config) => {
        config.modResults = config.modResults.filter(
            (item) => !(item.type === 'property' && item.key === KEY)
        );
        config.modResults.push({ type: 'property', key: KEY, value: JVM_ARGS });
        return config;
    });
}

module.exports = withAndroidGradleMemory;
