import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: '就活管理アプリ',
        short_name: '就活アプリ',
        description: '就活のスケジュールを管理するアプリ',
        start_url: '/',
        display: 'standalone', // 👈 これが重要！ブラウザの枠を消す設定
        background_color: '#ffffff',
        theme_color: '#2563eb',
        icons: [
            {
                src: '/icon.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}