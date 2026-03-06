

const OWNER = 'Shirelle8280';
const REPO = 'ToWhereOnline';
const BRANCH = 'main';

async function checkPublic() {
    const dirPath = 'public/images/cities/北京';
    const encodedDirPath = dirPath.split('/').map(encodeURIComponent).join('/');
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodedDirPath}?ref=${BRANCH}`;

    console.log('Fetching without token:', url);
    const res = await fetch(url);

    if (res.ok) {
        console.log('Repo is PUBLIC!');
    } else {
        console.log(`Repo is PRIVATE (or missing). Status: ${res.status}`);
        const text = await res.text();
        console.log('Response:', text);
    }
}

checkPublic();
