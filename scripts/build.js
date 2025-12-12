const fs = require('fs');
const path = require('path');

const packagesDir = path.join(__dirname, '../packages');
const outputFile = path.join(__dirname, '../plugins.json');

// 读取现有的 plugins.json
function getExistingPlugins() {
    if (!fs.existsSync(outputFile)) {
        return {};
    }

    try {
        const content = fs.readFileSync(outputFile, 'utf-8');
        const data = JSON.parse(content);
        const pluginMap = {};

        if (data.packages && Array.isArray(data.packages)) {
            data.packages.forEach(pkg => {
                if (pkg.id) {
                    pluginMap[pkg.id] = pkg;
                }
            });
        }

        return pluginMap;
    } catch (error) {
        console.error('读取现有 plugins.json 失败:', error.message);
        return {};
    }
}

// 读取所有插件的 manifest.json
function collectManifests() {
    const packages = [];
    const existingPlugins = getExistingPlugins();

    if (!fs.existsSync(packagesDir)) {
        console.log('packages 目录不存在');
        return packages;
    }

    const dirs = fs.readdirSync(packagesDir);

    for (const dir of dirs) {
        const manifestPath = path.join(packagesDir, dir, 'manifest.json');

        if (fs.existsSync(manifestPath)) {
            try {
                const content = fs.readFileSync(manifestPath, 'utf-8');
                const manifest = JSON.parse(content);

                if (!manifest.id) {
                    console.error(`✗ ${dir}/manifest.json 缺少 id 字段`);
                    continue;
                }

                // 如果是已存在的插件，保留原有的 addedAt；否则使用当前时间
                const addedAt = existingPlugins[manifest.id]?.addedAt || Date.now();

                const plugin = {
                    ...manifest,
                    addedAt,
                    folder: dir
                };

                const status = existingPlugins[manifest.id] ? '更新' : '新增';
                packages.push(plugin);
                console.log(`✓ 已收集: ${dir} (id: ${manifest.id}, ${status})`);
            } catch (error) {
                console.error(`✗ 读取 ${dir}/manifest.json 失败:`, error.message);
            }
        }
    }

    return packages;
}

// 更新 plugins.json
function updatePluginsJson() {
    const packages = collectManifests();

    const data = {
        datetime: Date.now(),
        packages: packages
    };

    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\n✓ 已更新 plugins.json，共 ${packages.length} 个插件`);
}

updatePluginsJson();
