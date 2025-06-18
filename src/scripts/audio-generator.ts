/**
 * Script de génération audio automatique
 * À déployer sur votre VPS XXL
 * 
 * Usage: node audio-generator.js
 * Cron: 0 1 * * * /usr/bin/node /path/to/audio-generator.js
 */

import { Pool } from 'pg';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.VITE_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
const CLOUDFLARE_R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const CLOUDFLARE_R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY;
const CLOUDFLARE_R2_SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_KEY;
const CLOUDFLARE_R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL manquant');
}

const pool = new Pool({ connectionString: DATABASE_URL });

interface StepToProcess {
  id: string;
  instruction: string;
  recipe_title: string;
}

class AudioGenerator {
  private audioDir = '/tmp/audio';
  private elevenLabsQuotaUsed = 0;
  private elevenLabsQuotaLimit = 100000; // Caractères par mois
  private quotaRowId: string | null = null;

  constructor() {
    // Créer le dossier audio temporaire
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }
  }

  private async initQuota(): Promise<void> {
    const { rows } = await pool.query(
      'SELECT * FROM audio_quota ORDER BY updated_at DESC LIMIT 1'
    );
    const data = rows[0];

    if (!data) {
      const { rows: createdRows } = await pool.query(
        'INSERT INTO audio_quota(quota_limit) VALUES($1) RETURNING *',
        [this.elevenLabsQuotaLimit]
      );
      const created = createdRows[0];
      if (created) {
        this.quotaRowId = created.id;
        this.elevenLabsQuotaUsed = created.used_chars;
        this.elevenLabsQuotaLimit = created.quota_limit;
      }
    } else {
      this.quotaRowId = data.id;
      this.elevenLabsQuotaUsed = data.used_chars;
      this.elevenLabsQuotaLimit = data.quota_limit;
    }
  }

  async generateAudioForSteps(): Promise<void> {
    console.log('🔊 Début de la génération audio automatique');

    await this.initQuota();

    // Récupérer les étapes sans audio
    const { rows: steps } = await pool.query(
      `SELECT sc.id, sc.instruction, rc.title as recipe_title
       FROM steps_clean sc
       JOIN recipes_clean rc ON rc.id = sc.recipe_id
       WHERE sc.id NOT IN (
         SELECT step_id FROM steps_audio WHERE status = 'ready'
       )
       LIMIT 100`
    );

    if (!steps || steps.length === 0) {
      console.log('ℹ️ Aucune étape à traiter pour l\'audio');
      return;
    }

    console.log(`🎵 ${steps.length} étapes à traiter`);

    const results = await Promise.allSettled(
      steps.map(s => this.processStepAudio(s))
    );
    results.forEach((res, idx) => {
      const step = steps[idx];
      if (res.status === 'rejected') {
        console.error(`❌ Erreur génération audio étape ${step.id}:`, res.reason);
      } else {
        console.log(`✅ Audio généré pour étape: ${step.instruction.substring(0, 50)}...`);
      }
    });

    console.log('🎉 Génération audio terminée');
  }

  private async processStepAudio(step: any): Promise<void> {
    const instruction = step.instruction.trim();
    const instructionHash = this.generateHash(instruction);

    // Vérifier si l'audio existe déjà
    const { rows: existingRows } = await pool.query(
      'SELECT * FROM steps_audio WHERE instruction_hash = $1 LIMIT 1',
      [instructionHash]
    );
    const existingAudio = existingRows[0];

    if (existingAudio) {
      await pool.query(
        'UPDATE steps_clean SET audio_id = $1 WHERE id = $2',
        [existingAudio.id, step.id]
      );
      return;
    }

    // Marquer comme en cours de génération
    const { rows: insertRows } = await pool.query(
      `INSERT INTO steps_audio(step_id, instruction_hash, audio_url, provider, source, language, voice_id, status)
       VALUES ($1,$2,'', 'elevenlabs', 'elevenlabs','fr',$3,'generating')
       RETURNING *`,
      [step.id, instructionHash, ELEVENLABS_VOICE_ID]
    );
    const audioRecord = insertRows[0];

    if (!audioRecord) {
      throw new Error('Impossible de créer l\'enregistrement audio');
    }

    try {
      let audioBuffer: Buffer;
      let provider: string;
      let quality: string;

      // Essayer ElevenLabs d'abord
      if (this.canUseElevenLabs(instruction.length)) {
        try {
          audioBuffer = await this.generateWithElevenLabs(instruction);
          provider = 'elevenlabs';
          quality = 'high';
          await this.incrementQuota(instruction.length);
        } catch (error) {
          console.log('⚠️ ElevenLabs failed, fallback to gTTS');
          audioBuffer = await this.generateWithGTTS(instruction);
          provider = 'gtts';
          quality = 'standard';
        }
      } else {
        audioBuffer = await this.generateWithGTTS(instruction);
        provider = 'gtts';
        quality = 'standard';
      }

      // Sauvegarder le fichier temporairement
      const fileName = `${instructionHash}.mp3`;
      const filePath = path.join(this.audioDir, fileName);
      fs.writeFileSync(filePath, audioBuffer);

      // Upload vers Cloudflare R2 (ou stockage local)
      const audioUrl = await this.uploadAudio(fileName, audioBuffer);

      // Calculer la durée (approximation)
      const duration = this.estimateAudioDuration(instruction);

      // Mettre à jour l'enregistrement
      await pool.query(
        `UPDATE steps_audio
         SET audio_url=$1, provider=$2, source=$2, duration_seconds=$3,
             file_size_bytes=$4, quality=$5, status='ready', voice_id=$6
         WHERE id=$7`,
        [audioUrl, provider, duration, audioBuffer.length, quality, ELEVENLABS_VOICE_ID, audioRecord.id]
      );

      await pool.query(
        'UPDATE steps_clean SET audio_id=$1 WHERE id=$2',
        [audioRecord.id, step.id]
      );

      // Nettoyer le fichier temporaire
      fs.unlinkSync(filePath);

    } catch (error) {
      // Marquer comme échoué
      await pool.query('UPDATE steps_audio SET status=$1 WHERE id=$2', ['failed', audioRecord.id]);
      
      throw error;
    }
  }

  private canUseElevenLabs(charCount: number): boolean {
    return Boolean(ELEVENLABS_API_KEY) &&
           this.elevenLabsQuotaUsed + charCount <= this.elevenLabsQuotaLimit;
  }

  private async generateWithElevenLabs(instruction: string): Promise<Buffer> {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('Clé API ElevenLabs manquante');
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: instruction,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  private async generateWithGTTS(instruction: string): Promise<Buffer> {
    // Simulation gTTS - en production, utilisez la vraie API gTTS
    // ou une alternative comme Azure Speech, Google Cloud TTS, etc.
    
    const response = await fetch('https://api.streamelements.com/kappa/v2/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        voice: 'Celine',
        text: instruction
      })
    });

    if (!response.ok) {
      throw new Error(`gTTS fallback error: ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  private async uploadAudio(fileName: string, audioBuffer: Buffer): Promise<string> {
    if (CLOUDFLARE_R2_ENDPOINT && CLOUDFLARE_R2_ACCESS_KEY) {
      // Upload vers Cloudflare R2
      return this.uploadToCloudflareR2(fileName, audioBuffer);
    } else {
      // Stockage local (pour développement)
      const localPath = `/var/audio/steps/${fileName}`;
      const localDir = path.dirname(localPath);
      
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      
      fs.writeFileSync(localPath, audioBuffer);
      return `file://${localPath}`;
    }
  }

  private async uploadToCloudflareR2(fileName: string, audioBuffer: Buffer): Promise<string> {
    // Implémentation upload Cloudflare R2
    // En production, utilisez le SDK AWS S3 compatible
    
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/mpeg' }), fileName);

    const response = await fetch(`${CLOUDFLARE_R2_ENDPOINT}/${CLOUDFLARE_R2_BUCKET}/${fileName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_R2_ACCESS_KEY}`,
        'Content-Type': 'audio/mpeg'
      },
      body: audioBuffer
    });

    if (!response.ok) {
      throw new Error(`Cloudflare R2 upload error: ${response.status}`);
    }

    return `https://${CLOUDFLARE_R2_BUCKET}.r2.dev/${fileName}`;
  }

  private generateHash(instruction: string): string {
    return crypto
      .createHash('sha256')
      .update(instruction.toLowerCase().trim())
      .digest('hex');
  }

  private estimateAudioDuration(instruction: string): number {
    // Estimation: ~150 mots par minute, ~5 caractères par mot
    const wordsPerMinute = 150;
    const charactersPerWord = 5;
    const charactersPerMinute = wordsPerMinute * charactersPerWord;
    
    return Math.max(2, Math.round((instruction.length / charactersPerMinute) * 60));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async incrementQuota(chars: number): Promise<void> {
    if (!this.quotaRowId) return;
    this.elevenLabsQuotaUsed += chars;
    await pool.query(
      'UPDATE audio_quota SET used_chars=$1, updated_at=NOW() WHERE id=$2',
      [this.elevenLabsQuotaUsed, this.quotaRowId]
    );
  }
}

// Exécution du script
if (require.main === module) {
  const generator = new AudioGenerator();
  generator.generateAudioForSteps()
    .then(() => {
      console.log('✅ Génération audio terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export default AudioGenerator;
