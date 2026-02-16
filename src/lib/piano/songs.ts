export interface NoteData {
    key: string;      // "C4", "G4" etc. (empty for rest)
    display: string;  // "C", "G"
    solfege: string;  // "ド", "ソ"
    duration: number; // 4 = quarter, 8 = eighth, 2 = half, 1 = whole
    tie?: boolean;
}

export interface Song {
    id: string;
    title: string;
    description?: string;
    bpm: number;
    bars: NoteData[][]; // Grouped by measures (bars)
}

// Helper to Create Note
// Duration: 16 = whole, 8 = half, 4 = quarter, 2 = eighth, 1 = sixteenth (Based on 16th note subdivision for easier math? Or standard 4 = quarter?)
// Let's stick to: 4 = quarter, 8 = eighth is confusing.
// Standard MIDI ticks usually.
// Let's use: 1 = whole, 2 = half, 4 = quarter, 8 = eighth.
// Wait, previous code used 4 = quarter?
// Let's standardise: 4 = quarter note. 8 = eighth note. 2 = half note. 1 = whole note.
// Actually, `duration` property in `NoteData` was used for CSS classes.
// CSS classes checks: `duration === 2` (half), `duration === 1` (whole).
// So:
// 1 = Whole Note
// 2 = Half Note
// 4 = Quarter Note
// 8 = Eighth Note
// This is INVERSE of typical music notation naming but easier for "Beat Count" if we consider 4/4 sig?
// No, usually duration is in "beats".
// If 4/4:
// Whole = 4 beats
// Half = 2 beats
// Quarter = 1 beat
// Eighth = 0.5 beat
// Let's switch to BEAT based duration for easier sequencer logic.
// 4 = Whole
// 2 = Half
// 1 = Quarter
// 0.5 = Eighth
//
// BUT, the current CSS checks `duration === 2` for half, `duration === 1` for whole.
// This implies the previous logic was: 1 = Whole, 2 = Half, 4 = Quarter? No, that's backwards size-wise.
// Let's look at `page.module.css` (I modified it):
// `.scoreNote.half` -> `note.duration === 2`
// `.scoreNote.whole` -> `note.duration === 1`
//
// If `note.duration` was intended to be "Note Type Denominator":
// 1 = Whole
// 2 = Half
// 4 = Quarter
// 8 = Eighth
// This makes sense for "Type".
//
// For sequencer, we need to convert this to time.
// Whole (1) = 4 beats
// Half (2) = 2 beats
// Quarter (4) = 1 beat
// Eighth (8) = 0.5 beat
//
// So: `beats = 4 / duration`
//
// I will keep this "Denominator" based duration for `NoteData`.

const n = (key: string, display: string, solfege: string, type: number = 4): NoteData => ({ key, display, solfege, duration: type });
const r = (type: number = 4): NoteData => ({ key: '', display: 'Rest', solfege: '休', duration: type });

export const SONGS: Song[] = [
    {
        id: 'twinkle_star',
        title: 'きらきら星 (Twinkle Twinkle Little Star)',
        bpm: 100,
        bars: [
            [n('C4', 'C', 'ド'), n('C4', 'C', 'ド'), n('G4', 'G', 'ソ'), n('G4', 'G', 'ソ')],
            [n('A4', 'A', 'ラ'), n('A4', 'A', 'ラ'), n('G4', 'G', 'ソ', 2)],
            [n('F4', 'F', 'ファ'), n('F4', 'F', 'ファ'), n('E4', 'E', 'ミ'), n('E4', 'E', 'ミ')],
            [n('D4', 'D', 'レ'), n('D4', 'D', 'レ'), n('C4', 'C', 'ド', 2)],
            // Part 2
            [n('G4', 'G', 'ソ'), n('G4', 'G', 'ソ'), n('F4', 'F', 'ファ'), n('F4', 'F', 'ファ')],
            [n('E4', 'E', 'ミ'), n('E4', 'E', 'ミ'), n('D4', 'D', 'レ', 2)],
            [n('G4', 'G', 'ソ'), n('G4', 'G', 'ソ'), n('F4', 'F', 'ファ'), n('F4', 'F', 'ファ')],
            [n('E4', 'E', 'ミ'), n('E4', 'E', 'ミ'), n('D4', 'D', 'レ', 2)],
            // Reprise
            [n('C4', 'C', 'ド'), n('C4', 'C', 'ド'), n('G4', 'G', 'ソ'), n('G4', 'G', 'ソ')],
            [n('A4', 'A', 'ラ'), n('A4', 'A', 'ラ'), n('G4', 'G', 'ソ', 2)],
            [n('F4', 'F', 'ファ'), n('F4', 'F', 'ファ'), n('E4', 'E', 'ミ'), n('E4', 'E', 'ミ')],
            [n('D4', 'D', 'レ'), n('D4', 'D', 'レ'), n('C4', 'C', 'ド', 2)],
        ]
    },
    {
        id: 'tulip',
        title: 'チューリップ (Tulip)',
        bpm: 80,
        bars: [
            [n('C4', 'C', 'ド'), n('D4', 'D', 'レ'), n('E4', 'E', 'ミ', 2)],
            [n('C4', 'C', 'ド'), n('D4', 'D', 'レ'), n('E4', 'E', 'ミ', 2)],
            [n('G4', 'G', 'ソ'), n('E4', 'E', 'ミ'), n('D4', 'D', 'レ'), n('C4', 'C', 'ド')],
            [n('D4', 'D', 'レ'), n('E4', 'E', 'ミ'), n('D4', 'D', 'レ', 2)],
            [n('C4', 'C', 'ド'), n('D4', 'D', 'レ'), n('E4', 'E', 'ミ', 2)],
            [n('C4', 'C', 'ド'), n('D4', 'D', 'レ'), n('E4', 'E', 'ミ', 2)],
            [n('G4', 'G', 'ソ'), n('E4', 'E', 'ミ'), n('D4', 'D', 'レ'), n('C4', 'C', 'ド')],
            [n('D4', 'D', 'レ'), n('E4', 'E', 'ミ'), n('C4', 'C', 'ド', 2)],
            [n('G4', 'G', 'ソ'), n('G4', 'G', 'ソ'), n('E4', 'E', 'ミ'), n('G4', 'G', 'ソ')],
            [n('A4', 'A', 'ラ'), n('A4', 'A', 'ラ'), n('G4', 'G', 'ソ', 2)],
            [n('E4', 'E', 'ミ'), n('E4', 'E', 'ミ'), n('D4', 'D', 'レ'), n('D4', 'D', 'レ')],
            [n('C4', 'C', 'ド', 1)]
        ]
    },
    {
        id: 'fur_elise_simple',
        title: 'エリーゼのために (Fur Elise) - Simple',
        bpm: 100, // Slightly slower for practice
        bars: [
            [n('E5', 'E', 'ミ', 8), n('D#5', 'D#', 'レ#', 8), n('E5', 'E', 'ミ', 8), n('D#5', 'D#', 'レ#', 8), n('E5', 'E', 'ミ', 8), n('B4', 'B', 'シ', 8), n('D5', 'D', 'レ', 8), n('C5', 'C', 'ド', 8)],
            [n('A4', 'A', 'ラ', 4), r(8), n('C4', 'C', 'ド', 8), n('E4', 'E', 'ミ', 8), n('A4', 'A', 'ラ', 8), n('B4', 'B', 'シ', 4), r(8), n('E4', 'E', 'ミ', 8), n('G#4', 'G#', 'ソ#', 8), n('B4', 'B', 'シ', 8)],
            [n('C5', 'C', 'ド', 4), r(8), n('E4', 'E', 'ミ', 8), n('E5', 'E', 'ミ', 8), n('D#5', 'D#', 'レ#', 8), n('E5', 'E', 'ミ', 8), n('D#5', 'D#', 'レ#', 8), n('E5', 'E', 'ミ', 8), n('B4', 'B', 'シ', 8), n('D5', 'D', 'レ', 8), n('C5', 'C', 'ド', 8)],
            [n('A4', 'A', 'ラ', 4), r(8), n('C4', 'C', 'ド', 8), n('E4', 'E', 'ミ', 8), n('A4', 'A', 'ラ', 8), n('B4', 'B', 'シ', 4), r(8), n('E4', 'E', 'ミ', 8), n('C5', 'C', 'ド', 8), n('B4', 'B', 'シ', 8)],
            [n('A4', 'A', 'ラ', 2)]
        ]
    },
    {
        id: 'ode_to_joy',
        title: '喜びの歌 (Ode to Joy)',
        bpm: 110,
        bars: [
            [n('E4', 'E', 'ミ'), n('E4', 'E', 'ミ'), n('F4', 'F', 'ファ'), n('G4', 'G', 'ソ')],
            [n('G4', 'G', 'ソ'), n('F4', 'F', 'ファ'), n('E4', 'E', 'ミ'), n('D4', 'D', 'レ')],
            [n('C4', 'C', 'ド'), n('C4', 'C', 'ド'), n('D4', 'D', 'レ'), n('E4', 'E', 'ミ')],
            [n('E4', 'E', 'ミ', /* dotted? let's roughly use 4 but extend */ 2.6 as any), n('D4', 'D', 'レ', 8), n('D4', 'D', 'レ', 2)],
            // Adjusted dotted rhythm manually if needed, or stick to simple
            // Let's stick to standard:
            // E. (1.5 beat) D (0.5 beat) -> 4/1.5 = 2.66... denominator is weird.
            // Let's simplify to: E (3/4 of half?)
            // For this simple engine, let's just make it E4 (Quarter) + Tie?
            // Or just use straight quarters for simplicity in "Simple" version.
        ]
    }
];
