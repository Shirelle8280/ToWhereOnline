import { supabase } from './supabaseClient';

/**
 * 上传图片到 Supabase Storage
 * 
 * @param {File|Blob} file - 要上传的文件
 * @param {string} bucket - Bucket 名称 (如 'firsts-images')
 * @returns {Promise<{publicUrl: string, path: string}>}
 */
export async function uploadToSupabase(file, bucket = 'firsts-images') {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${file.name?.split('.').pop() || 'jpg'}`;
    const filePath = fileName; // 可以根据需要添加文件夹结构

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        throw error;
    }

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return { publicUrl, path: filePath };
}

/**
 * 获取图片的公开 URL
 */
export function getSupabasePublicUrl(path, bucket = 'firsts-images') {
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
    return publicUrl;
}
