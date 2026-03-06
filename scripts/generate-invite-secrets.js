#!/usr/bin/env node
/**
 * 生成邀请码系统所需的密钥
 * 
 * 用法：node scripts/generate-invite-secrets.js <邀请码> <GitHub Token>
 * 
 * 输出：
 * 1. 邀请码的 SHA-256 哈希（用于验证）
 * 2. 用邀请码加密后的 GitHub Token（AES-GCM）
 */

const crypto = require('crypto');

const inviteCode = process.argv[2];
const githubToken = process.argv[3];

if (!inviteCode || !githubToken) {
    console.error('用法: node scripts/generate-invite-secrets.js <邀请码> <GitHub_Token>');
    console.error('例如: node scripts/generate-invite-secrets.js mySecretCode123 github_pat_xxxx');
    process.exit(1);
}

async function generateSecrets() {
    // 1. 计算邀请码的 SHA-256 哈希
    const hash = crypto.createHash('sha256').update(inviteCode).digest('hex');

    // 2. 从邀请码派生 AES-256 密钥
    const keyMaterial = crypto.createHash('sha256').update(inviteCode).digest();

    // 3. 生成随机 IV (12 bytes for AES-GCM)
    const iv = crypto.randomBytes(12);

    // 4. AES-GCM 加密 GitHub Token
    const cipher = crypto.createCipheriv('aes-256-gcm', keyMaterial, iv);
    let encrypted = cipher.update(githubToken, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // 将 iv + authTag + ciphertext 合并为一个字符串
    const encryptedBundle = iv.toString('hex') + ':' + authTag + ':' + encrypted;

    console.log('\n========================================');
    console.log('  邀请码密钥生成完成！');
    console.log('========================================\n');
    console.log('请将以下值复制到 src/lib/authUtils.js 中：\n');
    console.log(`INVITE_CODE_HASH = '${hash}'`);
    console.log(`ENCRYPTED_GITHUB_TOKEN = '${encryptedBundle}'`);
    console.log('\n========================================\n');
}

generateSecrets();
