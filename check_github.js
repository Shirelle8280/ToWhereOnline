

const OWNER = 'Shirelle8280';
const REPO = 'ToWhereOnline';
const BRANCH = 'main';
const TOKEN = process.env.GITHUB_TOKEN || ''; // 从环境变量读取，不要硬编码在这里

async function listGitHubFiles() {
    // Correct way to encode for GitHub API is to encode the whole path after /contents/
    const dirPath = 'public/images/cities/北京';
    const encodedDirPath = dirPath.split('/').map(encodeURIComponent).join('/');
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodedDirPath}?ref=${BRANCH}`;

    console.log('Fetching:', url);
    const res = await fetch(url, {
        headers: { Authorization: `token ${TOKEN}` }
    });

    if (res.ok) {
        const data = await res.json();
        console.log('Files on GitHub:');
        data.forEach(file => {
            console.log(`- ${file.name}`);
            if (file.name.includes('_0')) {
                console.log(`  Count of underscores after _0: ${file.name.split('_0')[1].split('.')[0].length}`);
            }
        });
    } else {
        console.error('Failed to list files:', res.status, await res.text());
    }
}

listGitHubFiles();
