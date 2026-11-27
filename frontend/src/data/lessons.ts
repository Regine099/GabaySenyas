export interface Lesson {
  letter: string;
  type: 'static' | 'dynamic';
  steps: string[];
  tip?: string;
  image: string;
}

const lessonContent: Record<string, Pick<Lesson, 'type' | 'steps'>> = {
  A: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with the palm facing forward.',
      'Close all four fingers into a relaxed fist against your palm.',
      'Keep your thumb resting straight along the side of your index finger.',
    ],
  },
  B: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing forward.',
      'Extend all four fingers straight up and press them together.',
      'Fold your thumb neatly across the center of your palm.',
    ],
  },
  C: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing to the side.',
      'Curve all four fingers together into a half-circle.',
      'Curve your thumb downward to match the fingers, forming a C shape.',
    ],
  },
  D: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing forward.',
      'Point your index finger straight up toward the ceiling.',
      'Curve your middle, ring, and pinky fingers down to touch the tip of your thumb.',
    ],
  },
  E: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing forward.',
      'Curl all four fingers downward so your fingertips rest near the top of your palm.',
      'Tuck your thumb horizontally across your palm underneath your curled fingers.',
    ],
  },
  F: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing forward.',
      'Touch the tip of your index finger to the tip of your thumb to form a circle.',
      'Extend your middle, ring, and pinky fingers straight up and slightly apart.',
    ],
  },
  G: {
    type: 'static',
    steps: [
      'Turn your dominant hand sideways so the back of your hand faces forward.',
      'Point your index finger and thumb horizontally to the side, parallel to each other.',
      'Curl your middle, ring, and pinky fingers tightly into your palm.',
    ],
  },
  H: {
    type: 'static',
    steps: [
      'Turn your dominant hand sideways with your palm facing toward your body.',
      'Extend both your index and middle fingers horizontally together.',
      'Fold your ring and pinky fingers into your palm and rest your thumb over them.',
    ],
  },
  I: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing forward.',
      'Extend your pinky finger straight up.',
      'Curl your index, middle, and ring fingers into your palm and rest your thumb across them.',
    ],
  },
  J: {
    type: 'dynamic',
    steps: [
      'Start with the handshape for the letter I, with your pinky pointing up.',
      'Trace a J shape in the air by scooping your pinky downward and curving up toward your body.',
      'Finish the motion with your palm facing toward you.',
    ],
  },
  K: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing forward.',
      'Point your index finger straight up and angle your middle finger slightly forward.',
      'Place the tip of your thumb against the middle joint of your middle finger, while curling your ring and pinky fingers down.',
    ],
  },
  L: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing forward.',
      'Point your index finger straight up and extend your thumb outward to form an L shape.',
      'Curl your middle, ring, and pinky fingers tightly into your palm.',
    ],
  },
  M: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing forward.',
      'Tuck your thumb across your palm toward the base of your pinky.',
      'Fold your index, middle, and ring fingers down over your thumb, keeping your pinky tucked underneath.',
    ],
  },
  N: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing forward.',
      'Tuck your thumb across your palm toward the base of your ring finger.',
      'Fold your index and middle fingers down over your thumb, keeping your ring and pinky fingers curled into your palm.',
    ],
  },
  O: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing slightly to the side.',
      'Curve all four fingers forward so their tips touch the tip of your thumb.',
      'Keep the fingers together to form a round O shape.',
    ],
  },
  P: {
    type: 'static',
    steps: [
      'Form the handshape for the letter K.',
      'Tilt your wrist downward so your index finger points forward and your middle finger points straight down.',
      'Keep your thumb pressed against the middle joint of your middle finger.',
    ],
  },
  Q: {
    type: 'static',
    steps: [
      'Form the handshape for the letter G.',
      'Tilt your wrist downward so both your index finger and thumb point straight toward the floor.',
      'Keep your remaining three fingers curled tightly into your palm.',
    ],
  },
  R: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing forward.',
      'Extend your index and middle fingers straight up and cross your middle finger behind your index finger.',
      'Curl your ring and pinky fingers into your palm and hold them down with your thumb.',
    ],
  },
  S: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing forward.',
      'Close all four fingers tightly into a fist.',
      'Wrap your thumb horizontally across the front of your curled fingers.',
    ],
  },
  T: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing forward.',
      'Tuck your thumb between your index and middle fingers so the tip pokes out.',
      'Curl all four fingers down into a fist around your thumb.',
    ],
  },
  U: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing forward.',
      'Extend your index and middle fingers straight up and press them together.',
      'Curl your ring and pinky fingers into your palm and rest your thumb across them.',
    ],
  },
  V: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing forward.',
      'Extend your index and middle fingers straight up and spread them apart into a V shape.',
      'Curl your ring and pinky fingers into your palm and rest your thumb across them.',
    ],
  },
  W: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing forward.',
      'Extend your index, middle, and ring fingers straight up and spread them slightly apart.',
      'Curl your pinky finger into your palm and hold it down with the tip of your thumb.',
    ],
  },
  X: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing forward.',
      'Raise your index finger and bend it at the middle joint into a hook shape.',
      'Curl your middle, ring, and pinky fingers into your palm and rest your thumb against them.',
    ],
  },
  Y: {
    type: 'static',
    steps: [
      'Hold your dominant hand upright with your palm facing forward.',
      'Extend your thumb and pinky finger outward while keeping the middle three fingers curled into your palm.',
      'Keep your wrist straight and relaxed.',
    ],
  },
  Z: {
    type: 'dynamic',
    steps: [
      'Hold your dominant hand upright with your index finger pointing straight up and other fingers curled in.',
      'Draw a Z shape in the air with your index fingertip moving horizontally, diagonally down, and horizontally again.',
      'Keep your palm facing forward throughout the movement.',
    ],
  },
};

export const LESSONS: Lesson[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => ({
  letter,
  ...lessonContent[letter],
  image: `/reference/${letter}.jpg`,
}));
