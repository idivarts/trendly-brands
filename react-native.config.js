module.exports = {
    dependencies: {
        "@react-native-firebase/app": {
            platforms: {
                android: {
                    packageImportPath: 'import io.invertase.firebase.app.ReactNativeFirebaseAppPackage;',
                },
            },
        },
    },
};
de