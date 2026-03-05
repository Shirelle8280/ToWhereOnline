import { createClient } from '@supabase/supabase-js';

// Hardcoded for migration script convenience
const supabaseUrl = 'https://fakokuvqtlpijcukvekj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZha29rdXZxdGxwaWpjdWt2ZWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MTk0MzcsImV4cCI6MjA4MzQ5NTQzN30.Xy542SBt6AG_kEAySkHjbggJGZAGIa0wif0yOU0wuFg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const cityConfig = {
    '深圳': {
        mainImage: '/images/cities/深圳/main.jpg',
        description: '2024.12.28 ～',
        gallery: [
            '/images/cities/深圳/WechatIMG681.jpg', '/images/cities/深圳/WechatIMG680.jpg', '/images/cities/深圳/WechatIMG678.jpg', '/images/cities/深圳/WechatIMG677.jpg', '/images/cities/深圳/WechatIMG668.jpg', '/images/cities/深圳/WechatIMG667.jpg', '/images/cities/深圳/WechatIMG666.jpg', '/images/cities/深圳/174561752948654_.pic.jpg', '/images/cities/深圳/174571752948655_.pic.jpg', '/images/cities/深圳/174581752948656_.pic.jpg', '/images/cities/深圳/174591752948657_.pic.jpg', '/images/cities/深圳/17502dc85364660503dec9ed421273c9.JPG', '/images/cities/深圳/3c3d8449a75d7b2aad3e5782e2feeee6.JPG', '/images/cities/深圳/98bc3fad79b516e57fcde61b144de33c.JPG', '/images/cities/深圳/IMG_0029.jpg', '/images/cities/深圳/IMG_0044.jpg', '/images/cities/深圳/IMG_0048.jpg', '/images/cities/深圳/IMG_0049.jpg', '/images/cities/深圳/IMG_0051.jpg', '/images/cities/深圳/IMG_0072.jpg', '/images/cities/深圳/IMG_0098.jpg', '/images/cities/深圳/IMG_0103.jpg', '/images/cities/深圳/IMG_0288.jpeg', '/images/cities/深圳/IMG_0289.jpeg', '/images/cities/深圳/IMG_0291.jpeg', '/images/cities/深圳/IMG_0302.jpeg', '/images/cities/深圳/IMG_0303.jpeg', '/images/cities/深圳/IMG_0304.jpeg', '/images/cities/深圳/IMG_0305.jpeg', '/images/cities/深圳/IMG_0306.jpeg', '/images/cities/深圳/IMG_0335.jpeg', '/images/cities/深圳/IMG_0345.jpeg', '/images/cities/深圳/IMG_0346.JPG', '/images/cities/深圳/IMG_0347.jpeg', '/images/cities/深圳/IMG_0351.jpeg', '/images/cities/深圳/IMG_0352.jpeg', '/images/cities/深圳/IMG_0371.jpeg', '/images/cities/深圳/IMG_0373.jpeg', '/images/cities/深圳/IMG_0374.jpeg', '/images/cities/深圳/IMG_0404.jpeg', '/images/cities/深圳/IMG_0405.jpeg', '/images/cities/深圳/IMG_0408.jpeg', '/images/cities/深圳/IMG_0409.jpeg', '/images/cities/深圳/IMG_0410.jpeg', '/images/cities/深圳/IMG_0416.jpeg', '/images/cities/深圳/IMG_0419.jpeg', '/images/cities/深圳/IMG_0420.JPG', '/images/cities/深圳/IMG_0440.jpeg', '/images/cities/深圳/IMG_0441.jpeg', '/images/cities/深圳/IMG_0462.jpeg', '/images/cities/深圳/IMG_0496.jpeg', '/images/cities/深圳/IMG_0498.jpeg', '/images/cities/深圳/IMG_0525.jpeg', '/images/cities/深圳/IMG_0625.jpeg', '/images/cities/深圳/IMG_0626.jpeg', '/images/cities/深圳/IMG_0628.jpeg', '/images/cities/深圳/IMG_0630.jpeg', '/images/cities/深圳/IMG_0631.JPG', '/images/cities/深圳/IMG_0643.jpeg', '/images/cities/深圳/IMG_0705.JPG', '/images/cities/深圳/IMG_0710.JPG', '/images/cities/深圳/IMG_0720.JPG', '/images/cities/深圳/IMG_0724.jpeg', '/images/cities/深圳/IMG_0725.jpeg', '/images/cities/深圳/IMG_0735.jpeg', '/images/cities/深圳/IMG_0736.jpeg', '/images/cities/深圳/IMG_0746.jpeg', '/images/cities/深圳/IMG_0750.jpeg', '/images/cities/深圳/IMG_0751.jpeg', '/images/cities/深圳/IMG_0752.jpeg', '/images/cities/深圳/IMG_0753.jpeg', '/images/cities/深圳/IMG_0754.jpeg', '/images/cities/深圳/IMG_0755.jpeg', '/images/cities/深圳/IMG_0756.jpeg', '/images/cities/深圳/IMG_0757.jpeg', '/images/cities/深圳/IMG_0759.jpeg', '/images/cities/深圳/IMG_0760.jpeg', '/images/cities/深圳/IMG_0761.jpeg', '/images/cities/深圳/IMG_0773.jpeg', '/images/cities/深圳/IMG_0774.jpeg', '/images/cities/深圳/IMG_20241228_224923.jpg', '/images/cities/深圳/IMG_20241228_224936.jpg', '/images/cities/深圳/IMG_20250315_231412.jpg', '/images/cities/深圳/IMG_20250427_135810.jpg', '/images/cities/深圳/IMG_20250516_155828.jpg', '/images/cities/深圳/IMG_20250616_003707.jpg', '/images/cities/深圳/IMG_20250621_052601.jpg', '/images/cities/深圳/IMG_20250621_053002.jpg', '/images/cities/深圳/IMG_20250621_055705.jpg', '/images/cities/深圳/IMG_20250702_072347.jpg', '/images/cities/深圳/IMG_20250702_072400.jpg', '/images/cities/深圳/IMG_20250706_090021.jpg', '/images/cities/深圳/IMG_20250706_090637.jpg', '/images/cities/深圳/IMG_20250706_172944.jpg', '/images/cities/深圳/IMG_20250706_172947.jpg', '/images/cities/深圳/IMG_20250706_175215.jpg', '/images/cities/深圳/IMG_20250706_175219.jpg', '/images/cities/深圳/IMG_20250706_175621.jpg', '/images/cities/深圳/IMG_20250707_063900.jpg', '/images/cities/深圳/IMG_20250707_205303.jpg', '/images/cities/深圳/IMG_20250707_235656.jpg', '/images/cities/深圳/IMG_8749.JPG', '/images/cities/深圳/IMG_8799.JPG', '/images/cities/深圳/IMG_8803.JPG', '/images/cities/深圳/IMG_8823.JPG', '/images/cities/深圳/IMG_8827.JPG', '/images/cities/深圳/IMG_8829.JPG', '/images/cities/深圳/IMG_8840.JPG', '/images/cities/深圳/IMG_8846.JPG', '/images/cities/深圳/IMG_9012.JPG', '/images/cities/深圳/IMG_9013.JPG', '/images/cities/深圳/IMG_9071.JPG', '/images/cities/深圳/IMG_9072.JPG', '/images/cities/深圳/IMG_9073.JPG', '/images/cities/深圳/IMG_9075.JPG', '/images/cities/深圳/IMG_9079.JPG', '/images/cities/深圳/IMG_9131.JPG', '/images/cities/深圳/IMG_9140.JPG', '/images/cities/深圳/IMG_9141.JPG', '/images/cities/深圳/IMG_9166.JPG', '/images/cities/深圳/IMG_9167.JPG', '/images/cities/深圳/IMG_9186.JPG', '/images/cities/深圳/IMG_9195.JPG', '/images/cities/深圳/IMG_9196.JPG', '/images/cities/深圳/IMG_9325.JPG', '/images/cities/深圳/IMG_9326.JPG', '/images/cities/深圳/IMG_9488.JPG', '/images/cities/深圳/IMG_9489.JPG', '/images/cities/深圳/IMG_9490.JPG', '/images/cities/深圳/WechatIMG17803.jpg', '/images/cities/深圳/WechatIMG17804.jpg', '/images/cities/深圳/WechatIMG17809.jpg', '/images/cities/深圳/WechatIMG17810.jpg', '/images/cities/深圳/WechatIMG17812.jpg', '/images/cities/深圳/WechatIMG17813.jpg', '/images/cities/深圳/WechatIMG17814.jpg', '/images/cities/深圳/WechatIMG17815.jpg', '/images/cities/深圳/WechatIMG17816.jpg', '/images/cities/深圳/WechatIMG17817.jpg', '/images/cities/深圳/WechatIMG17818.jpg', '/images/cities/深圳/WechatIMG676.jpg', '/images/cities/深圳/WechatIMG741.jpg', '/images/cities/深圳/WechatIMG742.jpg', '/images/cities/深圳/WechatIMG743.jpg', '/images/cities/深圳/WechatIMG744.jpg', '/images/cities/深圳/WechatIMG745.jpg', '/images/cities/深圳/WechatIMG746.jpg', '/images/cities/深圳/WechatIMG747.jpg', '/images/cities/深圳/WechatIMG9363.jpg', '/images/cities/深圳/WechatIMG9364.jpg', '/images/cities/深圳/WechatIMG9365.jpg', '/images/cities/深圳/WechatIMG9366.jpg', '/images/cities/深圳/WechatIMG9367.jpg', '/images/cities/深圳/WechatIMG9368.jpg', '/images/cities/深圳/WechatIMG9369.jpg', '/images/cities/深圳/WechatIMG9370.jpg', '/images/cities/深圳/promphoto_1747390988553.jpg', '/images/cities/深圳/promphoto_1747390988668.jpg', '/images/cities/深圳/promphoto_1747390988694.jpg', '/images/cities/深圳/promphoto_1747390988721.jpg', '/images/cities/深圳/wx_camera_1746593650868.jpg', '/images/cities/深圳/wx_camera_1746673550009.jpg', '/images/cities/深圳/wx_camera_1747030914549.jpg', '/images/cities/深圳/wx_camera_1751770864385.jpg', '/images/cities/深圳/wx_camera_1751903753776.jpg', '/images/cities/深圳/wx_camera_1752934528042.jpg'
        ]
    },
    '香港': {
        mainImage: '/images/cities/香港/main.jpg',
        description: '2024.9 ～ 2025.7',
        gallery: [
            '/images/cities/香港/mmexport1753246771006.jpg', '/images/cities/香港/mmexport1752421249989.jpg', '/images/cities/香港/mmexport1752421152574.jpg', '/images/cities/香港/wx_camera_1746968527226.jpg', '/images/cities/香港/IMG_20250511_185935.jpg', '/images/cities/香港/IMG_20250511_185922.jpg', '/images/cities/香港/IMG_20250510_155901.jpg', '/images/cities/香港/IMG_20250510_155857.jpg', '/images/cities/香港/IMG_20250510_155845.jpg', '/images/cities/香港/IMG_20250507_144431.jpg', '/images/cities/香港/IMG_20250503_103617.jpg', '/images/cities/香港/wx_camera_1745584891132.jpg', '/images/cities/香港/IMG_20250325_175518.jpg', '/images/cities/香港/Screenshot_20250315_203100_com.tencent.mm.jpg', '/images/cities/香港/wx_camera_1741849979088.jpg', '/images/cities/香港/wx_camera_1741849027523.jpg', '/images/cities/香港/IMG_20250313_145558.jpg', '/images/cities/香港/IMG_20250313_145524.jpg', '/images/cities/香港/IMG_20250313_145008.jpg', '/images/cities/香港/wx_camera_1739541018151.jpg', '/images/cities/香港/IMG_20250214_212427.jpg', '/images/cities/香港/IMG_20250214_212028.jpg', '/images/cities/香港/IMG_20250208_080930.jpg', '/images/cities/香港/wx_camera_1738747120938.jpg', '/images/cities/香港/wx_camera_1735282504779.jpg', '/images/cities/香港/IMG_20241202_065859.jpg'
        ]
    },
    '惠州': {
        mainImage: '/images/cities/惠州/main.jpg',
        description: '2025.6.8',
        gallery: [
            '/images/cities/惠州/WechatIMG17788.jpg', '/images/cities/惠州/WechatIMG17789.jpg', '/images/cities/惠州/WechatIMG17790.jpg', '/images/cities/惠州/WechatIMG17791.jpg', '/images/cities/惠州/WechatIMG17792.jpg', '/images/cities/惠州/WechatIMG17793.jpg', '/images/cities/惠州/WechatIMG17794.jpg', '/images/cities/惠州/WechatIMG17795.jpg', '/images/cities/惠州/WechatIMG17796.jpg'
        ]
    },
    '珠海': {
        mainImage: '/images/cities/珠海/main.jpg',
        description: '2025.6.6 ～ 2025.6.7',
        gallery: [
            '/images/cities/珠海/main2.jpg', '/images/cities/珠海/main1.jpg'
        ]
    },
    '中山': {
        mainImage: '/images/cities/中山/main.jpg',
        description: '2025.6.7 ～ 2025.6.8',
        gallery: [
            '/images/cities/中山/WechatIMG17786.jpg', '/images/cities/中山/WechatIMG17787.jpg'
        ]
    },
    '东莞': {
        mainImage: '/images/cities/东莞/main.jpg',
        description: '2025.3.3',
        gallery: [
            '/images/cities/东莞/IMG_9327.JPG', '/images/cities/东莞/IMG_9328.JPG', '/images/cities/东莞/WechatIMG17920.jpg'
        ]
    },
    '外伶仃岛': {
        mainImage: '/images/cities/外伶仃岛/main.jpg',
        description: '2025.2.20 ～ 2025.2.21',
        gallery: [
            '/images/cities/外伶仃岛/1.jpg', '/images/cities/外伶仃岛/2.jpg', '/images/cities/外伶仃岛/3.jpg', '/images/cities/外伶仃岛/4.jpg'
        ]
    },
    '南澳岛': {
        mainImage: '/images/cities/南澳岛/main.jpg',
        description: '2025.4.9 ～ 2025.4.10',
        gallery: [
            '/images/cities/南澳岛/1.jpg', '/images/cities/南澳岛/2.jpg', '/images/cities/南澳岛/3.jpg', '/images/cities/南澳岛/4.jpg', '/images/cities/南澳岛/5.jpg', '/images/cities/南澳岛/6.jpg'
        ]
    },
    '台北': {
        mainImage: '/images/cities/台北/main.jpg',
        description: '2025.6.25 ～ 2025.6.27',
        gallery: [
            '/images/cities/台北/main1.jpg', '/images/cities/台北/IMG_20250627_143554.jpg', '/images/cities/台北/IMG_20250627_135427.jpg', '/images/cities/台北/Screenshot_20250627_122532_com.gbox.android.jpg', '/images/cities/台北/IMG_20250627_115535.jpg', '/images/cities/台北/Screenshot_20250627_003954_com.easy.abroad.jpg', '/images/cities/台北/IMG_20250626_204833.jpg', '/images/cities/台北/IMG_20250626_170428.jpg', '/images/cities/台北/wx_camera_1750927440445.jpg', '/images/cities/台北/wx_camera_1750927393137.jpg', '/images/cities/台北/IMG_20250626_163810.jpg', '/images/cities/台北/IMG_20250626_163415.jpg', '/images/cities/台北/IMG_20250626_163151.jpg', '/images/cities/台北/IMG_20250626_155200.jpg', '/images/cities/台北/Screenshot_20250626_153256_com.gbox.android.jpg', '/images/cities/台北/IMG_20250626_150205.jpg', '/images/cities/台北/IMG_20250626_145510.jpg', '/images/cities/台北/IMG_20250626_141614.jpg', '/images/cities/台北/Screenshot_20250625_221039_com.gbox.android.jpg', '/images/cities/台北/IMG_20250625_210721.jpg', '/images/cities/台北/IMG_20250625_201232.jpg', '/images/cities/台北/IMG_20250625_194953.jpg', '/images/cities/台北/IMG_20250625_184730.jpg', '/images/cities/台北/IMG_20250625_184619.jpg', '/images/cities/台北/IMG_20250625_184612.jpg', '/images/cities/台北/IMG_20250625_170315.jpg', '/images/cities/台北/IMG_20250625_170309.jpg', '/images/cities/台北/IMG_20250625_170300.jpg', '/images/cities/台北/IMG_20250625_170257.jpg', '/images/cities/台北/wx_camera_1750812335001.jpg'
        ]
    },
    '马来西亚': {
        mainImage: '/images/cities/马来西亚/main.jpg',
        description: '2025.1.5 ～ 2025.1.10',
        gallery: [
            '/images/cities/马来西亚/Screenshot_20250107_095012_com.tencent.mm.jpg', '/images/cities/马来西亚/mmexport1752421184942.jpg', '/images/cities/马来西亚/mmexport1752421179187.jpg', '/images/cities/马来西亚/IMG-20250109-WA0011.jpg', '/images/cities/马来西亚/IMG-20250109-WA0008.jpg', '/images/cities/马来西亚/IMG-20250109-WA0006.jpg', '/images/cities/马来西亚/IMG-20250108-WA0006.jpg', '/images/cities/马来西亚/IMG-20250108-WA0005.jpg', '/images/cities/马来西亚/IMG_20250106_205620.jpg', '/images/cities/马来西亚/IMG-20250106-WA0003.jpg', '/images/cities/马来西亚/IMG-20250106-WA0002.jpg', '/images/cities/马来西亚/IMG_20250106_090114.jpg', '/images/cities/马来西亚/IMG_20250106_083836.jpg'
        ]
    },
    '成都': {
        mainImage: '/images/cities/成都/main.jpg',
        description: '2025.1.17 ～ 2025.1.19',
        gallery: [
            '/images/cities/成都/1.jpg', '/images/cities/成都/2.jpg', '/images/cities/成都/3.jpg', '/images/cities/成都/4.jpg', '/images/cities/成都/5.jpg', '/images/cities/成都/6.jpg', '/images/cities/成都/7.jpg', '/images/cities/成都/8.jpg', '/images/cities/成都/9.jpg', '/images/cities/成都/10.jpg', '/images/cities/成都/11.jpg', '/images/cities/成都/12.jpg', '/images/cities/成都/13.jpg', '/images/cities/成都/14.jpg', '/images/cities/成都/15.jpg', '/images/cities/成都/16.jpg', '/images/cities/成都/17.jpg', '/images/cities/成都/18.jpg', '/images/cities/成都/IMG_0814.jpeg', '/images/cities/成都/IMG_0891.jpeg', '/images/cities/成都/IMG_0892.jpeg', '/images/cities/成都/IMG_0893.jpeg', '/images/cities/成都/IMG_0894.jpeg', '/images/cities/成都/IMG_0896.jpeg', '/images/cities/成都/IMG_0898.jpeg', '/images/cities/成都/IMG_0901.jpeg', '/images/cities/成都/IMG_0902.jpeg', '/images/cities/成都/IMG_0903.jpeg', '/images/cities/成都/IMG_0904.jpeg', '/images/cities/成都/IMG_0911.jpeg', '/images/cities/成都/IMG_0921.jpeg', '/images/cities/成都/IMG_0922.jpeg', '/images/cities/成都/IMG_0923.jpeg', '/images/cities/成都/IMG_0925.JPG', '/images/cities/成都/IMG_0934.jpeg', '/images/cities/成都/IMG_0935.jpeg', '/images/cities/成都/IMG_0936.jpeg', '/images/cities/成都/IMG_0955.jpeg', '/images/cities/成都/IMG_0956.JPG', '/images/cities/成都/IMG_0958.jpeg', '/images/cities/成都/IMG_20250117_163342.jpg', '/images/cities/成都/IMG_20250117_190929.jpg', '/images/cities/成都/IMG_20250117_191041.jpg', '/images/cities/成都/IMG_20250117_192403.jpg', '/images/cities/成都/IMG_20250117_193028.jpg', '/images/cities/成都/IMG_20250117_214252.jpg', '/images/cities/成都/IMG_20250118_140452.jpg', '/images/cities/成都/IMG_20250118_183439.jpg', '/images/cities/成都/IMG_9578.JPG', '/images/cities/成都/IMG_9579.JPG', '/images/cities/成都/IMG_9586.JPG', '/images/cities/成都/IMG_9635.JPG', '/images/cities/成都/IMG_9638.JPG', '/images/cities/成都/IMG_9639.JPG', '/images/cities/成都/IMG_9643.JPG', '/images/cities/成都/IMG_9646.JPG', '/images/cities/成都/IMG_9652.JPG', '/images/cities/成都/IMG_9654.JPG', '/images/cities/成都/IMG_9656.JPG', '/images/cities/成都/IMG_9661.JPG', '/images/cities/成都/IMG_9664.JPG', '/images/cities/成都/IMG_9665.JPG', '/images/cities/成都/IMG_9715.JPG', '/images/cities/成都/IMG_9718.JPG', '/images/cities/成都/IMG_9795.JPG', '/images/cities/成都/wx_camera_1737088949704.jpg', '/images/cities/成都/wx_camera_1737112380979.jpg', '/images/cities/成都/wx_camera_1737114486709.jpg', '/images/cities/成都/wx_camera_1737115166280.jpg', '/images/cities/成都/wx_camera_1737116510333.jpg', '/images/cities/成都/wx_camera_1737116951020.jpg', '/images/cities/成都/wx_camera_1737117741151.jpg', '/images/cities/成都/wx_camera_1737118409291.jpg', '/images/cities/成都/wx_camera_1737119207475.jpg', '/images/cities/成都/wx_camera_1737120168538.jpg', '/images/cities/成都/wx_camera_1737120562077.jpg', '/images/cities/成都/wx_camera_1737121258563.jpg'
        ]
    },
    '广元': {
        mainImage: '/images/cities/广元/main.jpg',
        description: '2025.1.20 ～ 2025.1.22',
        gallery: [
            '/images/cities/广元/1.jpg', '/images/cities/广元/2.jpg', '/images/cities/广元/IMG_0809.jpeg', '/images/cities/广元/IMG_0812.jpeg', '/images/cities/广元/IMG_20250120_150636.jpg', '/images/cities/广元/IMG_20250121_133018.jpg', '/images/cities/广元/IMG_20250121_133119.jpg', '/images/cities/广元/IMG_20250121_170202.jpg', '/images/cities/广元/IMG_20250121_170319.jpg', '/images/cities/广元/IMG_20250121_170330.jpg', '/images/cities/广元/IMG_20250121_170732.jpg', '/images/cities/广元/IMG_20250121_171110.jpg', '/images/cities/广元/IMG_20250121_171148.jpg', '/images/cities/广元/IMG_20250121_171711.jpg', '/images/cities/广元/IMG_20250121_193319.jpg', '/images/cities/广元/IMG_20250121_193321.jpg', '/images/cities/广元/IMG_20250121_193322.jpg', '/images/cities/广元/IMG_20250122_121732.jpg', '/images/cities/广元/IMG_20250122_160030.jpg', '/images/cities/广元/IMG_9542.JPG', '/images/cities/广元/Screenshot_20250121_135951_com.tencent.mm.jpg', '/images/cities/广元/wx_camera_1737176969675.jpg', '/images/cities/广元/wx_camera_1737533757223.jpg'
        ]
    },
    '绵阳': {
        mainImage: '/images/cities/绵阳/main.jpg',
        description: '2025.1.19 ～ 2025.1.20',
        gallery: [
            '/images/cities/绵阳/1.jpg', '/images/cities/绵阳/2.jpg', '/images/cities/绵阳/3.jpg', '/images/cities/绵阳/4.jpg', '/images/cities/绵阳/wx_camera_1737270310924.jpg'
        ]
    },
    '台南': {
        mainImage: '/images/cities/台南/main.jpg',
        description: '2025.6.27 ～ 2025.6.28',
        gallery: [
            '/images/cities/台南/IMG_20250628_124359.jpg', '/images/cities/台南/IMG_20250628_114513.jpg', '/images/cities/台南/IMG_20250628_112051.jpg', '/images/cities/台南/IMG_20250628_111655.jpg', '/images/cities/台南/IMG_20250628_111544.jpg', '/images/cities/台南/IMG_20250628_094048.jpg', '/images/cities/台南/IMG_20250627_195256.jpg', '/images/cities/台南/IMG_20250627_194600.jpg', '/images/cities/台南/IMG_20250627_194217.jpg', '/images/cities/台南/IMG_20250627_194007.jpg', '/images/cities/台南/IMG_20250627_183604.jpg', '/images/cities/台南/IMG_20250627_182724.jpg', '/images/cities/台南/IMG_20250627_180152.jpg', '/images/cities/台南/IMG_20250627_171642.jpg', '/images/cities/台南/IMG_20250627_161731.jpg', '/images/cities/台南/IMG_20250627_161727.jpg', '/images/cities/台南/IMG_20250627_160837.jpg'
        ]
    },
    '高雄': {
        mainImage: '/images/cities/高雄/main.jpg',
        description: '2025.6.28 ～ 2025.6.29',
        gallery: [
            '/images/cities/高雄/1.jpg', '/images/cities/高雄/2.jpg', '/images/cities/高雄/3.jpg', '/images/cities/高雄/4.jpg', '/images/cities/高雄/5.jpg', '/images/cities/高雄/6.jpg', '/images/cities/高雄/7.jpg', '/images/cities/高雄/8.jpg', '/images/cities/高雄/9.jpg', '/images/cities/高雄/10.jpg', '/images/cities/高雄/IMG_20250628_172733.jpg', '/images/cities/高雄/IMG_20250628_172721.jpg', '/images/cities/高雄/IMG_20250628_161319.jpg', '/images/cities/高雄/IMG_20250628_161321.jpg', '/images/cities/高雄/IMG_20250628_145059.jpg', '/images/cities/高雄/IMG_20250628_142952.jpg'
        ]
    },
    '河源': {
        mainImage: '/images/cities/河源/main.jpeg',
        description: '',
        gallery: [
            '/images/cities/河源/IMG_0671.jpeg', '/images/cities/河源/IMG_0672.jpeg', '/images/cities/河源/IMG_0673.jpeg', '/images/cities/河源/IMG_0674.jpeg', '/images/cities/河源/IMG_0675.jpeg', '/images/cities/河源/IMG_0676.jpeg', '/images/cities/河源/IMG_0678.jpeg', '/images/cities/河源/IMG_0679.jpeg', '/images/cities/河源/IMG_0680.jpeg', '/images/cities/河源/IMG_0681.jpeg', '/images/cities/河源/IMG_0684.jpeg', '/images/cities/河源/IMG_0687.jpeg', '/images/cities/河源/IMG_0688.jpeg', '/images/cities/河源/IMG_0689.jpeg', '/images/cities/河源/IMG_0690.jpeg', '/images/cities/河源/IMG_0696.jpeg', '/images/cities/河源/IMG_0697.jpeg', '/images/cities/河源/IMG_0698.jpeg', '/images/cities/河源/IMG_0699.jpeg', '/images/cities/河源/IMG_9412.JPG', '/images/cities/河源/IMG_9413.JPG', '/images/cities/河源/IMG_9414.JPG', '/images/cities/河源/IMG_9415.JPG', '/images/cities/河源/IMG_9417.JPG', '/images/cities/河源/IMG_9419.JPG', '/images/cities/河源/IMG_9420.JPG', '/images/cities/河源/IMG_9428.JPG', '/images/cities/河源/IMG_9431.JPG', '/images/cities/河源/IMG_9433.JPG', '/images/cities/河源/IMG_9435.JPG', '/images/cities/河源/IMG_9437.JPG', '/images/cities/河源/IMG_9438.JPG', '/images/cities/河源/IMG_9439.JPG', '/images/cities/河源/IMG_9440.JPG', '/images/cities/河源/IMG_9441.JPG'
        ]
    },
    '桂林': {
        mainImage: '/images/cities/桂林/main.jpeg',
        description: '',
        gallery: [
            '/images/cities/桂林/IMG_0796.jpeg', '/images/cities/桂林/IMG_0798.jpeg', '/images/cities/桂林/IMG_0799.jpeg', '/images/cities/桂林/IMG_9531.JPG', '/images/cities/桂林/IMG_9535.JPG', '/images/cities/桂林/IMG_9536.JPG'
        ]
    },
    '重庆': {
        mainImage: '/images/cities/重庆/main.jpeg',
        description: '',
        gallery: [
            '/images/cities/重庆/IMG_0808.jpeg'
        ]
    },
    '阿坝州': {
        mainImage: '/images/cities/阿坝州/main.jpeg',
        description: '',
        gallery: [
            '/images/cities/阿坝州/IMG_0823.jpeg', '/images/cities/阿坝州/IMG_0824.jpeg', '/images/cities/阿坝州/IMG_0825.jpeg', '/images/cities/阿坝州/IMG_0826.jpeg', '/images/cities/阿坝州/IMG_0827.jpeg', '/images/cities/阿坝州/IMG_0830.jpeg', '/images/cities/阿坝州/IMG_0833.jpeg', '/images/cities/阿坝州/IMG_0851.jpeg', '/images/cities/阿坝州/IMG_0856.jpeg', '/images/cities/阿坝州/IMG_0857.jpeg', '/images/cities/阿坝州/IMG_0858.jpeg', '/images/cities/阿坝州/IMG_0859.jpeg', '/images/cities/阿坝州/IMG_0860.jpeg', '/images/cities/阿坝州/IMG_0861.jpeg', '/images/cities/阿坝州/IMG_0862.jpeg', '/images/cities/阿坝州/IMG_0870.jpeg', '/images/cities/阿坝州/IMG_0871.jpeg', '/images/cities/阿坝州/IMG_0872.jpeg', '/images/cities/阿坝州/IMG_0873.jpeg', '/images/cities/阿坝州/IMG_0874.jpeg', '/images/cities/阿坝州/IMG_0875.jpeg', '/images/cities/阿坝州/IMG_0876.jpeg', '/images/cities/阿坝州/IMG_0877.jpeg', '/images/cities/阿坝州/IMG_0878.jpeg', '/images/cities/阿坝州/IMG_0882.jpeg', '/images/cities/阿坝州/IMG_0883.jpeg', '/images/cities/阿坝州/IMG_0884.jpeg', '/images/cities/阿坝州/IMG_0959.PNG', '/images/cities/阿坝州/IMG_0960.jpeg', '/images/cities/阿坝州/IMG_0961.jpeg', '/images/cities/阿坝州/IMG_0962.jpeg', '/images/cities/阿坝州/IMG_0963.jpeg', '/images/cities/阿坝州/IMG_0964.jpeg', '/images/cities/阿坝州/IMG_0965.jpeg', '/images/cities/阿坝州/IMG_0966.PNG', '/images/cities/阿坝州/IMG_9557.JPG', '/images/cities/阿坝州/IMG_9559.JPG', '/images/cities/阿坝州/IMG_9560.JPG', '/images/cities/阿坝州/IMG_9561.JPG', '/images/cities/阿坝州/IMG_9562.JPG', '/images/cities/阿坝州/IMG_9563.JPG', '/images/cities/阿坝州/IMG_9564.JPG', '/images/cities/阿坝州/IMG_9565.JPG', '/images/cities/阿坝州/IMG_9566.JPG', '/images/cities/阿坝州/IMG_9567.JPG', '/images/cities/阿坝州/IMG_9568.JPG', '/images/cities/阿坝州/IMG_9569.JPG', '/images/cities/阿坝州/IMG_9571.JPG', '/images/cities/阿坝州/IMG_9572.JPG'
        ]
    },
};

async function migrate() {
    console.log('Starting migration...');
    let order = 0;
    for (const [name, config] of Object.entries(cityConfig)) {
        console.log(`Migrating city: ${name}`);
        // Insert city
        const { data: cityData, error: cityError } = await supabase
            .from('cities')
            .upsert({
                name,
                description: config.description,
                main_image: config.mainImage,
                sort_order: order++
            }, { onConflict: 'name' })
            .select()
            .single();

        if (cityError) {
            console.error(`Error inserting city ${name}:`, cityError);
            continue;
        }

        const cityId = cityData.id;

        // Insert gallery images
        if (config.gallery && config.gallery.length > 0) {
            console.log(`Inserting ${config.gallery.length} images for ${name}`);
            const imageObjects = config.gallery.map((url, index) => ({
                city_id: cityId,
                url,
                sort_order: index
            }));

            const { error: imagesError } = await supabase
                .from('city_images')
                .insert(imageObjects);

            if (imagesError) {
                console.error(`Error inserting images for city ${name}:`, imagesError);
            }
        }
    }
    console.log('Migration completed!');
}

migrate();
