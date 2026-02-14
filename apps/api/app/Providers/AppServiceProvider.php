<?php

namespace App\Providers;

use App\Services\NoAclS3Adapter;
use App\Services\NoAclVisibilityConverter;
use Aws\S3\S3Client;
use Illuminate\Filesystem\AwsS3V3Adapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;
use League\Flysystem\Filesystem as Flysystem;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Passport::tokensCan([
            '*' => 'Full access',
            'read:campaigns' => 'Read campaigns',
            'write:campaigns' => 'Create, update, delete campaigns',
            'read:characters' => 'Read characters',
            'write:characters' => 'Create, update, delete characters',
            'read:content' => 'Read game content (spells, monsters, items)',
            'write:content' => 'Create, update, delete game content',
            'read:users' => 'Read users',
            'write:users' => 'Create, update, delete users',
        ]);

        // Register custom S3 driver for buckets with "Bucket owner enforced" (no ACLs)
        Storage::extend('s3-no-acl', function ($app, $config) {
            $s3Config = $this->formatS3Config($config);

            $client = new S3Client($s3Config);

            $root = (string) ($config['root'] ?? '');

            $adapter = new NoAclS3Adapter(
                $client,
                $s3Config['bucket'],
                $root,
                new NoAclVisibilityConverter(),
            );

            $driver = new Flysystem($adapter, ['public_url' => $config['url'] ?? null]);

            return new AwsS3V3Adapter($driver, $adapter, $config, $client);
        });
    }

    /**
     * Format the S3 configuration array for AWS SDK.
     */
    protected function formatS3Config(array $config): array
    {
        $config += ['version' => 'latest'];

        if (!empty($config['key']) && !empty($config['secret'])) {
            $config['credentials'] = [
                'key' => $config['key'],
                'secret' => $config['secret'],
                'token' => $config['token'] ?? null,
            ];
        }

        return $config;
    }
}
