/**
 * GitHub Repository Image Storage
 * 
 * 使用 GitHub Contents API 将图片上传到 GitHub 仓库，
 * 并通过 raw.githubusercontent.com 提供公开访问。
 */

import { getToken } from './githubApi';

const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER;
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO;
const GITHUB_BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'main';

// 图片存储的目录前缀
const IMAGE_DIR = 'uploads/images';

/**
 * 将 File/Blob 转换为 Base64 字符串
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // 移除 data:xxx;base64, 前缀
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * 生成唯一的文件名
 */
function generateFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = originalName ? originalName.split('.').pop() : 'jpg';
    return `${timestamp}-${random}.${ext}`;
}

/**
 * 上传图片到 GitHub 仓库
 * 
 * @param {File|Blob} file - 要上传的文件
 * @param {string} [subDir=''] - 子目录（如 'firsts'）
 * @returns {Promise<{publicUrl: string, path: string}>}
 */
export async function uploadImage(file, subDir = '') {
    const token = getToken();
    if (!token || !GITHUB_OWNER || !GITHUB_REPO) {
        throw new Error('GitHub 存储未配置。请确认已通过邀请码验证。');
    }

    const fileName = generateFileName(file.name || 'photo.jpg');
    const filePath = subDir
        ? `${IMAGE_DIR}/${subDir}/${fileName}`
        : `${IMAGE_DIR}/${fileName}`;

    const base64Content = await fileToBase64(file);

    const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
            },
            body: JSON.stringify({
                message: `Upload image: ${fileName}`,
                content: base64Content,
                branch: GITHUB_BRANCH,
            }),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`GitHub 上传失败 (${response.status}): ${errorData.message || response.statusText}`);
    }

    const publicUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${filePath}`;

    return { publicUrl, path: filePath };
}

/**
 * 获取图片的公开 URL
 * 
 * @param {string} path - 文件在仓库中的路径
 * @returns {string} 公开访问 URL
 */
export function getPublicUrl(path) {
    return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${path}`;
}
