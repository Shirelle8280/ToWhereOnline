
const { createClient } = require('@supabase/supabase-js');

// 旧项目 (Source)
const OLD_URL = 'https://fakokuvqtlpijcukvekj.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZha29rdXZxdGxwaWpjdWt2ZWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MTk0MzcsImV4cCI6MjA4MzQ5NTQzN30.Xy542SBt6AG_kEAySkHjbggJGZAGIa0wif0yOU0wuFg';

// 新项目 (Target) - 从你的 .env 中提取
const NEW_URL = 'https://xnnewfjkibkaehlesipy.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubmV3ZmpraWJrYWVobGVzaXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTk1MzYsImV4cCI6MjA4ODI5NTUzNn0.6BFwHjR1Pd_ml1wYy1I_MOAZX8ikSnr1nVSFTJHy2XA';

const oldClient = createClient(OLD_URL, OLD_KEY);
const newClient = createClient(NEW_URL, NEW_KEY);

const TABLES = ['firsts', 'checkins', 'keyword_tasks', 'app_config'];
const BUCKET = 'firsts-images';

async function migrateEverything() {
    console.log('🚀 开始全量数据迁移...');

    // 1. 迁移数据库表
    for (const table of TABLES) {
        console.log(`\n📦 正在同步表: ${table}...`);
        const { data, error: fetchError } = await oldClient.from(table).select('*');

        if (fetchError) {
            console.error(`❌ 获取 ${table} 失败:`, fetchError.message);
            continue;
        }

        if (!data || data.length === 0) {
            console.log(`⚠️ ${table} 表为空。`);
            continue;
        }

        console.log(`✅ 获取到 ${data.length} 条记录。`);

        // 如果是 firsts 表，我们需要更新图片 URL
        if (table === 'firsts') {
            data.forEach(item => {
                if (item.description && item.description.includes(OLD_URL)) {
                    item.description = item.description.replaceAll(OLD_URL, NEW_URL);
                }
            });
        }

        const { error: insertError } = await newClient.from(table).upsert(data);
        if (insertError) {
            console.error(`❌ 写入 ${table} 失败:`, insertError.message);
        } else {
            console.log(`🎉 ${table} 同步成功！`);
        }
    }

    // 2. 迁移 Storage Bucket
    console.log(`\n📂 开始迁移 Storage Bucket: ${BUCKET}...`);

    // 列出旧 Bucket 中的所有文件
    const { data: files, error: listError } = await oldClient.storage.from(BUCKET).list('', { limit: 1000 });

    if (listError) {
        console.error(`❌ 无法列出旧 Bucket 文件:`, listError.message);
    } else if (!files || files.length === 0) {
        console.log(`⚠️ 旧 Bucket 中没有文件。`);
    } else {
        console.log(`✅ 找到 ${files.length} 个文件，准备搬运...`);

        for (const file of files) {
            if (file.name === '.emptyFolderPlaceholder') continue;

            console.log(`⏳ 搬运文件: ${file.name}...`);

            // 下载文件
            const { data: blob, error: downloadError } = await oldClient.storage.from(BUCKET).download(file.name);

            if (downloadError) {
                console.error(`   ❌ 下载失败: ${file.name}`, downloadError.message);
                continue;
            }

            // 上传文件到新库
            const { error: uploadError } = await newClient.storage.from(BUCKET).upload(file.name, blob, {
                upsert: true
            });

            if (uploadError) {
                console.error(`   ❌ 上传失败: ${file.name}`, uploadError.message);
            } else {
                console.log(`   ✅ 搬运成功!`);
            }
        }
    }

    console.log('\n✨ 迁移任务全部完成！');
    console.log('💡 请确保在新项目中已手动创建 "firsts-images" bucket 并设置为 Public。');
}

migrateEverything();
