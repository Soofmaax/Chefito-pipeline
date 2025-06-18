# Production Checklist

## Environment
- Configure all variables from `.env.example` on the server
- Run database migrations
- Create cron jobs for scraping, correction and audio generation

## Monitoring
- Aggregate logs from `/var/log/chefito/`
- Track ElevenLabs quota via `audio_quota` table
- Alert on missing audio files or API failures

## Backup
- Schedule daily PostgreSQL backups
- Backup audio files from Cloudflare R2

## Health
- Expose a simple HTTP health check on each VPS
- Monitor disk usage and memory
