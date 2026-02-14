<?php

return [
    /*
     * The disk on which to store added files and derived images by default.
     */
    'disk_name' => env('MEDIA_DISK', 'public'),

    /*
     * The maximum file size of an item in bytes.
     */
    'max_file_size' => 1024 * 1024 * 500, // 500MB for audio/video

    /*
     * This queue connection will be used to generate derived and responsive images.
     */
    'queue_connection_name' => env('QUEUE_CONNECTION', 'redis'),

    /*
     * This queue will be used to generate derived and responsive images.
     */
    'queue_name' => 'media',

    /*
     * By default all conversions will be performed on a queue.
     */
    'queue_conversions_by_default' => env('QUEUE_CONVERSIONS', true),

    /*
     * The fully qualified class name of the media model.
     */
    'media_model' => Spatie\MediaLibrary\MediaCollections\Models\Media::class,

    /*
     * When enabled, media collections will be serialised using the default
     * temporary url generator.
     */
    'use_temporary_urls' => false,

    /*
     * The class that contains the strategy for determining a media file's path.
     */
    'path_generator' => Spatie\MediaLibrary\Support\PathGenerator\DefaultPathGenerator::class,

    /*
     * The class that contains the strategy for determining how to remove files.
     */
    'file_remover_class' => Spatie\MediaLibrary\Support\FileRemover\DefaultFileRemover::class,

    /*
     * Here you can specify which path generator should be used for the given class.
     */
    'custom_path_generators' => [
        // Model::class => PathGenerator::class
    ],

    /*
     * When urls to files get generated, this class will be called.
     */
    'url_generator' => Spatie\MediaLibrary\Support\UrlGenerator\DefaultUrlGenerator::class,

    /*
     * Whether to activate versioning when urls to files get generated.
     */
    'version_urls' => false,

    /*
     * The media library will try to optimize all converted images.
     */
    'image_optimizers' => [
        Spatie\ImageOptimizer\Optimizers\Jpegoptim::class => [
            '-m85',
            '--force',
            '--strip-all',
            '--all-progressive',
        ],
        Spatie\ImageOptimizer\Optimizers\Pngquant::class => [
            '--force',
        ],
        Spatie\ImageOptimizer\Optimizers\Optipng::class => [
            '-i0',
            '-o2',
            '-quiet',
        ],
    ],

    /*
     * These generators will be used to create an pointier
     * and smaller size images of uploaded images.
     */
    'image_generators' => [
        Spatie\MediaLibrary\Conversions\ImageGenerators\Image::class,
        Spatie\MediaLibrary\Conversions\ImageGenerators\Webp::class,
        Spatie\MediaLibrary\Conversions\ImageGenerators\Avif::class,
        Spatie\MediaLibrary\Conversions\ImageGenerators\Pdf::class,
        Spatie\MediaLibrary\Conversions\ImageGenerators\Svg::class,
        Spatie\MediaLibrary\Conversions\ImageGenerators\Video::class,
    ],

    /*
     * The path where to store temporary files while performing image conversions.
     */
    'temporary_directory_path' => null,

    /*
     * The engine that should perform the image conversions.
     * Should be either `gd` or `imagick`.
     */
    'image_driver' => env('IMAGE_DRIVER', 'gd'),

    /*
     * FFMPEG & FFProbe binaries paths
     */
    'ffmpeg_path' => env('FFMPEG_PATH', '/usr/bin/ffmpeg'),
    'ffprobe_path' => env('FFPROBE_PATH', '/usr/bin/ffprobe'),

    /*
     * The maximum amount of time in seconds a conversion may take.
     */
    'jobs' => [
        'perform_conversions' => [
            'timeout' => 60 * 60, // 1 hour for video conversions
        ],
    ],

    /*
     * Should media items be processed using queues.
     */
    'enable_temporary_uploads_session_affinity' => true,

    /*
     * When enabled, uploaded file names will be sanitized.
     */
    'sanitize_uploaded_files' => true,
];
