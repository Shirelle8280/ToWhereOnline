/**
 * 邀请码认证工具
 * 
 * 邀请码以 SHA-256 哈希存储，GitHub Token 以 AES-GCM 加密存储。
 * 只有输入正确邀请码的用户才能解密出 GitHub Token。
 */

// ============ 预生成的密钥 ============
// 由 scripts/generate-invite-secrets.js 生成
const INVITE_CODE_HASH = 'cf67ff9ee4a5eba10b99e73e02b294b3c4a133e25ab78bd15508bdb953ac0c5d';
const ENCRYPTED_GITHUB_TOKEN = 'e684cf0064a4a70046764b92:9e7918690a279d2467caa86fb212562b:122f5cf596b422044dde17870fed187616b7af18e9c06401cdb1ebfc02a37420fc37e018e30dd048122770f5c89e49d4f9f9b974d089c8b4eb6e4caac254bdf0c4a865b0e31c21be1ce716aaba09bf14704ec84acdeb76c2c4f69695b8';

const AUTH_KEY = 'towhere_authenticated';
const TOKEN_KEY = 'towhere_github_token';

/**
 * 计算字符串的 SHA-256 哈希（十六进制）
 */
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 将十六进制字符串转为 Uint8Array
 */
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}

/**
 * 使用邀请码解密 GitHub Token (AES-256-GCM)
 * 在浏览器中使用 Web Crypto API
 */
async function decryptToken(inviteCode) {
    const parts = ENCRYPTED_GITHUB_TOKEN.split(':');
    if (parts.length !== 3) throw new Error('加密数据格式错误');

    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = hexToBytes(ivHex);
    const authTag = hexToBytes(authTagHex);
    const ciphertext = hexToBytes(ciphertextHex);

    // 从邀请码派生 AES-256 密钥（SHA-256）
    const keyMaterial = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(inviteCode)
    );

    const key = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    // AES-GCM 需要 ciphertext + authTag 连接在一起
    const combined = new Uint8Array(ciphertext.length + authTag.length);
    combined.set(ciphertext);
    combined.set(authTag, ciphertext.length);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        combined
    );

    return new TextDecoder().decode(decrypted);
}

/**
 * 验证邀请码
 * @param {string} code - 用户输入的邀请码
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function verifyInviteCode(code) {
    try {
        const hash = await sha256(code.trim());
        if (hash !== INVITE_CODE_HASH) {
            return { valid: false, error: '邀请码无效' };
        }

        // 邀请码正确，解密 GitHub Token 并存入 localStorage
        const token = await decryptToken(code.trim());
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(AUTH_KEY, 'true');

        return { valid: true };
    } catch (err) {
        console.error('验证失败:', err);
        return { valid: false, error: '验证过程出错，请重试' };
    }
}

/**
 * 检查是否已通过邀请码验证
 */
export function isAuthenticated() {
    try {
        return localStorage.getItem(AUTH_KEY) === 'true';
    } catch {
        return false;
    }
}

/**
 * 退出登录，清除所有认证状态
 */
export function logout() {
    try {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(TOKEN_KEY);
    } catch { /* ignore */ }
}
