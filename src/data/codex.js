export const CODEX = [
  {
    id: 'strength',
    name: 'Strength',
    durationOptions: [15, 30],
    virtue: 'Discipline',
    baseDelta: { body: 0.55, mind: 0.08, relationships: 0, purpose: 0.12, legacy: 0.02, agency: 0.27 },
    phases: [
      ['Prepare', 60, 'Breathe slowly. Set your posture.', ['Stand tall with feet under hips.', 'Relax the jaw and shoulders.', 'Take four slow breaths before starting.']],
      ['Push', 180, 'Controlled push-ups or incline push-ups.', ['Hands slightly wider than shoulders.', 'Keep head, trunk and hips aligned.', 'Lower under control; stop before form breaks.', 'Easier: hands on a table or wall. Harder: slower lowering.']],
      ['Pull', 180, 'Rows with a bar, table, or loaded bags.', ['Lead with the elbows and keep the chest open.', 'Pull shoulder blades back without shrugging.', 'Pause briefly at the top.', 'Use a stable table only if it safely supports your weight.']],
      ['Legs', 180, 'Slow squats. Full control.', ['Feet about shoulder-width apart.', 'Sit the hips back while knees follow the toes.', 'Keep the whole foot in contact with the floor.', 'Stand tall without locking the knees.']],
      ['Core', 120, 'Plank or dead bug.', ['Plank: squeeze glutes and keep ribs down.', 'Dead bug: keep the lower back gently against the floor.', 'Breathe throughout; quality matters more than duration.', 'Stop if you feel sharp pain in the back or shoulders.']],
      ['Close', 60, 'Stand still. Recover your breath.', ['Let breathing slow naturally.', 'Notice effort, tension and energy.', 'Finish with one calm, deliberate breath.']]
    ]
  },
  {
    id: 'recovery',
    name: 'Recovery',
    durationOptions: [5, 15, 30],
    virtue: 'Temperance',
    baseDelta: { body: 0.28, mind: 0.24, relationships: 0.02, purpose: 0.04, legacy: 0, agency: 0.16 },
    phases: [
      ['Downshift', 120, 'Inhale for four. Exhale for six.', ['Breathe through the nose if comfortable.', 'Keep the exhale soft, long and unforced.', 'Let the shoulders descend with each exhale.']],
      ['Mobility', 300, 'Move slowly through shoulders, hips, and spine.', ['Use pain-free ranges only.', 'Move with the breath rather than forcing a stretch.', 'Circle shoulders, rotate the thoracic spine and open the hips.']],
      ['Walk', 360, 'Walk without your phone. Easy pace.', ['Keep the pace conversational.', 'Look into the distance instead of at the ground.', 'Let the arms swing naturally.']],
      ['Close', 60, 'Notice what changed.', ['Compare your breathing and muscle tension with the start.', 'Name one sensation without judging it.']]
    ]
  },
  {
    id: 'focus',
    name: 'Focus',
    durationOptions: [15, 30, 60],
    virtue: 'Wisdom',
    baseDelta: { body: 0.02, mind: 0.56, relationships: 0, purpose: 0.24, legacy: 0.08, agency: 0.24 },
    phases: [
      ['Define', 60, 'Write the single outcome that matters.', ['Use one concrete sentence.', 'Make the result observable.', 'Remove every task that is not needed for this outcome.']],
      ['Deep Work', 720, 'One task. No switching.', ['Silence notifications.', 'Keep only the necessary window or material open.', 'When distracted, note it and return without self-criticism.']],
      ['Close', 60, 'Record the next clear step.', ['Write the exact action that restarts the work.', 'Leave the workspace ready for the next session.']]
    ]
  },
  {
    id: 'walk',
    name: 'Walk',
    durationOptions: [5, 15, 30, 60],
    virtue: 'Balance',
    baseDelta: { body: 0.24, mind: 0.24, relationships: 0.02, purpose: 0.08, legacy: 0, agency: 0.12 },
    phases: [
      ['Begin', 60, 'Leave the screen behind.', ['Stand tall and release unnecessary tension.', 'Choose an easy route with minimal interruption.']],
      ['Walk', 720, 'Comfortable pace. Breathe through the nose when possible.', ['Let the stride remain natural.', 'Keep the pace easy enough to think clearly.', 'Notice three things around you without analysing them.']],
      ['Return', 60, 'Come back with one clear thought.', ['Slow down before stopping.', 'Keep one useful idea from the walk.']]
    ]
  },
  {
    id: 'connection',
    name: 'Connection',
    durationOptions: [5, 15, 30],
    virtue: 'Justice',
    baseDelta: { body: 0, mind: 0.18, relationships: 0.58, purpose: 0.14, legacy: 0.08, agency: 0.18 },
    phases: [
      ['Choose', 30, 'Choose one person who matters.', ['Choose presence, not efficiency.', 'Decide what full attention will look like.']],
      ['Connect', 600, 'Call, listen, play, or be fully present.', ['Put the phone away unless it is the means of contact.', 'Ask one genuine question.', 'Listen without preparing the next reply.']],
      ['Close', 30, 'End without rushing to the next thing.', ['Acknowledge the person directly.', 'Notice how the interaction changed your state.']]
    ]
  }
];

export { assessPracticeEligibility } from '../core/practice-capacity.js?v=capacity1';
