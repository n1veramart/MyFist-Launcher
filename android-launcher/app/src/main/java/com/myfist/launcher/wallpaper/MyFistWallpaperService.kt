package com.myfist.launcher.wallpaper

import android.net.Uri
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder

/**
 * Live wallpaper engine scaffold for rendering local image/video content.
 *
 * NOTE: Actual media rendering should be delegated to ExoPlayer/MediaPlayer for videos and
 * BitmapRegionDecoder/Coil for static images, all bound to this engine's surface lifecycle.
 */
class MyFistWallpaperService : WallpaperService() {

    override fun onCreateEngine(): Engine = MyFistWallpaperEngine()

    inner class MyFistWallpaperEngine : Engine() {
        private var sourceUri: Uri? = null

        override fun onSurfaceCreated(holder: SurfaceHolder) {
            super.onSurfaceCreated(holder)
            drawPlaceholder(holder)
        }

        override fun onVisibilityChanged(visible: Boolean) {
            super.onVisibilityChanged(visible)
            // Hook media playback pause/resume here.
        }

        fun setSource(uri: Uri) {
            sourceUri = uri
            // TODO: Persist and render selected image/video URI.
        }

        private fun drawPlaceholder(holder: SurfaceHolder) {
            val canvas = holder.lockCanvas()
            canvas?.let {
                it.drawColor(android.graphics.Color.BLACK)
                holder.unlockCanvasAndPost(it)
            }
        }
    }
}
