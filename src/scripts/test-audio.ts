import AudioGenerator from './audio-generator';

const instruction = process.argv.slice(2).join(' ');

if (!instruction) {
  console.error('Usage: node test-audio.js "Instruction de cuisine"');
  process.exit(1);
}

(async () => {
  const generator: any = new AudioGenerator();
  try {
    await generator.processStepAudio({
      id: 'test',
      instruction,
      recipe_title: 'Test'
    });
    console.log('✅ Audio generated successfully');
  } catch (err) {
    console.error('❌ Error generating audio:', err);
  }
})();


