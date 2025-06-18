/**
 * Script de génération audio automatique
 * À déployer sur votre VPS XXL
 * 
 * Usage: node audio-generator.js
 * Cron: 0 1 * * * /usr/bin/node /path/to/audio-generator.js
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const CLOUDFLARE_R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const CLOUDFLARE_R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY;
const CLOUDFLARE_R2_SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_KEY;
const CLOUDFLARE_R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface StepToProcess {
  id: string;
  instruction: string;
  recipe_title: string;
}

class AudioGenerator {
  private audioDir = '/tmp/audio';
  private elevenLabsQuotaUsed = 0;
  private elevenLabsQuotaLimit = 10000; // Caractères par mois

  constructor() {
    // Créer le dossier audio temporaire
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }
  }

  async generateAudioForSteps(): Promise<void> {
    console.log('🔊 Début de la génération audio automatique');

    // Récupérer les étapes sans audio
    const { data: steps, error } = await supabase
      .from('steps_clean')
      .select(`
        id,
        instruction,
        recipes_clean!inner(title)
      `)
      .not('id', 'in', `(
        SELECT step_id FROM steps_audio WHERE status = 'ready'
      )`)
      .limit(100);

    if (error) {
      console.error('❌ Erreur récupération étapes:', error);
      return;
    }

    if (!steps || steps.length === 0) {
      console.log('ℹ️ Aucune étape à traiter pour l\'audio');
      return;
    }

    console.log(`🎵 ${steps.length} étapes à traiter`);

    for (const step of steps) {
      try {
        await this.processStepAudio(step);
        console.log(`✅ Audio généré pour étape: ${step.instruction.substring(0, 50)}...`);
      } catch (error) {
        console.error(`❌ Erreur génération audio étape ${step.id}:`, error);
      }

      // Délai pour éviter la surcharge
      await this.delay(1000);
    }

    console.log('🎉 Génération audio terminée');
  }

  private async processStepAudio(step: any): Promise<void> {
    const instruction = step.instruction.trim();
    const instructionHash = this.generateHash(instruction);

    // Vérifier si l'audio existe déjà
    const { data: existingAudio } = await supabase
      .from('steps_audio')
      .select('*')
      .eq('instruction_hash', instructionHash)
      .single();

    if (existingAudio) {
      // Lier l'audio existant à cette étape
      await supabase
        .from('steps_audio')
        .insert({
          step_id: step.id,
          instruction_hash: instructionHash,
          audio_url: existingAudio.audio_url,
          provider: existingAudio.provider,
          duration_seconds: existingAudio.duration_seconds,
          file_size_bytes: existingAudio.file_size_bytes,
          quality: existingAudio.quality,
          language: 'fr',
          status: 'ready'
        });
      return;
    }

    // Marquer comme en cours de génération
    const { data: audioRecord } = await supabase
      .from('steps_audio')
      .insert({
        step_id: step.id,
        instruction_hash: instructionHash,
        audio_url: '', // Sera mis à jour après génération
        provider: 'elevenlabs', // Sera ajusté si fallback
        language: 'fr',
        status: 'generating'
      })
      .select()
      .single();

    if (!audioRecord) {
      throw new Error('Impossible de créer l\'enregistrement audio');
    }

    try {
      let audioBuffer: Buffer;
      let provider: string;
      let quality: string;

      // Essayer ElevenLabs d'abord
      if (this.canUseElevenLabs(instruction)) {
        try {
          audioBuffer = await this.generateWithElevenLabs(instruction);
          provider = 'elevenlabs';
          quality = 'high';
          this.elevenLabsQuotaUsed += instruction.length;
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
      await supabase
        .from('steps_audio')
        .update({
          audio_url: audioUrl,
          provider,
          duration_seconds: duration,
          file_size_bytes: audioBuffer.length,
          quality,
          status: 'ready'
        })
        .eq('id', audioRecord.id);

      // Nettoyer le fichier temporaire
      fs.unlinkSync(filePath);

    } catch (error) {
      // Marquer comme échoué
      await supabase
        .from('steps_audio')
        .update({ status: 'failed' })
        .eq('id', audioRecord.id);
      
      throw error;
    }
  }

  private canUseElevenLabs(instruction: string): boolean {
    return ELEVENLABS_API_KEY && 
           this.elevenLabsQuotaUsed + instruction.length < this.elevenLabsQuotaLimit;
  }

  private async generateWithElevenLabs(instruction: string): Promise<Buffer> {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('Clé API ElevenLabs manquante');
    }

    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
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