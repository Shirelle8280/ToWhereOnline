/**
 * GitHub REST API utilities for the ToWhere admin panel.
 * Handles token management (localStorage) and file uploads to the GitHub repo.
 */

const OWNER = import.meta.env.VITE_GITHUB_OWNER;
const REPO = import.meta.env.VITE_GITHUB_REPO;
const BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'main';
const TOKEN_KEY = 'towhere_github_token';

// Fallback to .env token if localStorage is empty
export function getToken() {
    try {
        return localStorage.getItem(TOKEN_KEY) || import.meta.env.VITE_GITHUB_TOKEN || '';
    } catch {
        return import.meta.env.VITE_GITHUB_TOKEN || '';
    }
}

export function setToken(token) {
    try {
        localStorage.setItem(TOKEN_KEY, token.trim());
        return true;
    } catch {
        return false;
    }
}

export function clearToken() {
    try {
        localStorage.removeItem(TOKEN_KEY);
    } catch { /* ignore */ }
}

export function hasToken() {
    return !!getToken();
}

// ========= GitHub API =========

/**
 * Upload a file to the GitHub repo via REST API.
 * @param {string} path - Repo-relative path, e.g. "public/images/cities/北京/photo1.jpg"
 * @param {string} base64Content - Base64-encoded file content (without data URI prefix)
 * @param {string} commitMessage - Git commit message
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadFileToGitHub(path, base64Content, commitMessage = 'Add image via ToWhere admin') {
    const token = getToken();
    if (!token) {
        return { success: false, error: 'GitHub Token 未配置' };
    }

    try {
        // Check if file already exists (to get its SHA for update)
        let sha = null;
        const checkRes = await fetch(
            `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
            { headers: { Authorization: `token ${token}` } }
        );
        if (checkRes.ok) {
            const existing = await checkRes.json();
            sha = existing.sha;
        }

        const body = {
            message: commitMessage,
            content: base64Content,
            branch: BRANCH,
        };
        if (sha) body.sha = sha;

        const res = await fetch(
            `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            }
        );

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            return { success: false, error: errData.message || `HTTP ${res.status}` };
        }

        const data = await res.json();
        const cdnUrl = getJsDelivrUrl(path);
        return { success: true, url: cdnUrl, rawUrl: data.content?.download_url };

    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Convert a repo-relative path to a jsDelivr CDN URL for instant availability.
 * @param {string} path - e.g. "public/images/cities/北京/photo1.jpg"
 * @returns {string} CDN URL
 */
export function getJsDelivrUrl(path) {
    // jsDelivr serves files from GitHub: https://cdn.jsdelivr.net/gh/user/repo@branch/path
    return `https://cdn.jsdelivr.net/gh/${OWNER}/${REPO}@${BRANCH}/${path}`;
}

/**
 * List files in a specific directory on GitHub.
 * @param {string} dirPath - e.g. "public/images/cities/北京"
 * @returns {Promise<{success: boolean, files?: Array<{name: string, path: string, sha: string, download_url: string}>, error?: string}>}
 */
export async function listFilesInDir(dirPath) {
    const token = getToken();
    if (!token) return { success: false, error: 'Token 未配置' };

    try {
        const res = await fetch(
            `https://api.github.com/repos/${OWNER}/${REPO}/contents/${dirPath}?ref=${BRANCH}`,
            { headers: { Authorization: `token ${token}` } }
        );
        if (!res.ok) {
            if (res.status === 404) return { success: true, files: [] };
            const errData = await res.json().catch(() => ({}));
            return { success: false, error: errData.message || `HTTP ${res.status}` };
        }
        const data = await res.json();
        const files = Array.isArray(data) ? data.filter(item => item.type === 'file') : [];
        return { success: true, files };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Delete a file from GitHub.
 * @param {string} path - Full path to the file.
 * @param {string} sha - The blob SHA of the file to delete.
 * @param {string} message - Commit message.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFileFromGitHub(path, sha, message = 'Delete image via ToWhere admin') {
    const token = getToken();
    if (!token) return { success: false, error: 'Token 未配置' };

    try {
        const res = await fetch(
            `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    sha,
                    branch: BRANCH,
                }),
            }
        );
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            return { success: false, error: errData.message || `HTTP ${res.status}` };
        }
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Validate GitHub token by calling the authenticated user endpoint.
 * @returns {Promise<{valid: boolean, username?: string, error?: string}>}
 */
export async function validateToken() {
    const token = getToken();
    if (!token) return { valid: false, error: 'Token 未配置' };

    try {
        const res = await fetch('https://api.github.com/user', {
            headers: { Authorization: `token ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            return { valid: true, username: data.login };
        }
        return { valid: false, error: `Token 无效 (HTTP ${res.status})` };
    } catch (err) {
        return { valid: false, error: err.message };
    }
}
